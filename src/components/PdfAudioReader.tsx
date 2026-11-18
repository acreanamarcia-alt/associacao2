import {
  BookOpen,
  FileAudio,
  Loader2,
  Pause,
  Play,
  Square,
  Upload,
  Volume2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OFFICIAL_ASSETS } from '../data/institutionalData';
import { useLanguage } from '../i18n/LanguageContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfTextSegment {
  id: string;
  pageNumber: number;
  text: string;
}

interface PdfAudioReaderProps {
  autoLoadOfficial?: boolean;
  compact?: boolean;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

function splitTextIntoReadableSegments(rawText: string): string[] {
  const cleaned = rawText
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];

  const sentenceChunks = cleaned
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ0-9“"])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: string[] = [];
  for (const chunk of sentenceChunks) {
    if (chunk.length <= 240) {
      result.push(chunk);
      continue;
    }
    const words = chunk.split(' ');
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 220 && current) {
        result.push(current.trim());
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current.trim()) {
      result.push(current.trim());
    }
  }
  return result;
}

async function extractPdfSegmentsFromBuffer(
  buffer: ArrayBuffer
): Promise<{ segments: PdfTextSegment[]; numPages: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const segments: PdfTextSegment[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    let pageLines: string[] = [];
    let currentLine = '';

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const piece = item.str;
      if (piece) {
        currentLine += (currentLine && !currentLine.endsWith(' ') && !piece.startsWith(' ') ? ' ' : '') + piece;
      }
      if ('hasEOL' in item && item.hasEOL) {
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }
        currentLine = '';
      }
    }
    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    const joinedPage = pageLines.join(' ');
    const pageChunks = splitTextIntoReadableSegments(joinedPage);

    pageChunks.forEach((chunk, idx) => {
      segments.push({
        id: `p${pageNum}-s${idx}`,
        pageNumber: pageNum,
        text: chunk,
      });
    });
  }

  return { segments, numPages: pdf.numPages };
}

export function PdfAudioReader({
  autoLoadOfficial = false,
  compact = false,
}: PdfAudioReaderProps) {
  const { lang, t } = useLanguage();
  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [segments, setSegments] = useState<PdfTextSegment[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [speechLang, setSpeechLang] = useState<string>(
    lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const segmentRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Refs para callbacks do SpeechSynthesis lerem o estado atual sem stale closures
  const segmentsRef = useRef<PdfTextSegment[]>([]);
  const rateRef = useRef<number>(rate);
  const speechLangRef = useRef<string>(speechLang);
  const selectedVoiceUriRef = useRef<string>(selectedVoiceUri);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const activeRunIdRef = useRef<number>(0);

  segmentsRef.current = segments;
  rateRef.current = rate;
  speechLangRef.current = speechLang;
  selectedVoiceUriRef.current = selectedVoiceUri;
  voicesRef.current = voices;

  useEffect(() => {
    const targetLang = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
    setSpeechLang(targetLang);
  }, [lang]);

  useEffect(() => {
    if (!speechSupported) return;
    const syncVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
    };
    syncVoices();
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', syncVoices);
    };
  }, [speechSupported]);

  const stopSpeech = useCallback(() => {
    activeRunIdRef.current += 1;
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeechStatus('idle');
    setActiveIndex(0);
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakSegmentAt = useCallback(
    (index: number) => {
      if (!speechSupported) return;
      const list = segmentsRef.current;
      if (index < 0 || index >= list.length) {
        setSpeechStatus('idle');
        setActiveIndex(0);
        return;
      }

      const runId = ++activeRunIdRef.current;
      window.speechSynthesis.cancel();

      const item = list[index];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = rateRef.current;
      utterance.lang = speechLangRef.current;

      const availableVoices = voicesRef.current;
      const explicitVoice = selectedVoiceUriRef.current
        ? availableVoices.find((v) => v.voiceURI === selectedVoiceUriRef.current)
        : undefined;
      const langPrefix = speechLangRef.current.slice(0, 2).toLowerCase();
      const autoVoice =
        explicitVoice ??
        availableVoices.find((v) => v.lang.toLowerCase() === speechLangRef.current.toLowerCase()) ??
        availableVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));

      if (autoVoice) {
        utterance.voice = autoVoice;
      }

      utterance.onstart = () => {
        if (activeRunIdRef.current !== runId) return;
        setActiveIndex(index);
        setSpeechStatus('playing');
      };

      utterance.onend = () => {
        if (activeRunIdRef.current !== runId) return;
        const nextIdx = index + 1;
        if (nextIdx < segmentsRef.current.length) {
          speakSegmentAt(nextIdx);
        } else {
          setSpeechStatus('idle');
          setActiveIndex(0);
        }
      };

      utterance.onerror = (event) => {
        if (activeRunIdRef.current !== runId) return;
        if (event.error === 'interrupted' || event.error === 'canceled') return;
        setSpeechStatus('idle');
      };

      setActiveIndex(index);
      setSpeechStatus('playing');
      window.speechSynthesis.speak(utterance);
    },
    [speechSupported]
  );

  useEffect(() => {
    if (speechStatus === 'playing') {
      const el = segmentRefs.current[activeIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeIndex, speechStatus]);

  const loadPdfFromBuffer = useCallback(
    async (buffer: ArrayBuffer, title: string) => {
      stopSpeech();
      setExtracting(true);
      setExtractError('');
      setDocumentTitle(title);
      try {
        const { segments: parsed, numPages } = await extractPdfSegmentsFromBuffer(buffer);
        setTotalPages(numPages);
        setSegments(parsed);
        setActiveIndex(0);
        if (parsed.length === 0) {
          setExtractError(t.pdfAudio.noTextExtracted);
        }
      } catch {
        setSegments([]);
        setTotalPages(0);
        setExtractError(t.pdfAudio.extractError);
      } finally {
        setExtracting(false);
      }
    },
    [stopSpeech, t.pdfAudio.extractError, t.pdfAudio.noTextExtracted]
  );

  const handleLoadOfficialPdf = useCallback(async () => {
    stopSpeech();
    setExtracting(true);
    setExtractError('');
    try {
      const response = await fetch(OFFICIAL_ASSETS.ebookPdf);
      if (!response.ok) {
        throw new Error('Fetch failed');
      }
      const buffer = await response.arrayBuffer();
      await loadPdfFromBuffer(
        buffer,
        'História da Associação Recanto Social Bom Pastor (E-book Oficial)'
      );
    } catch {
      setExtracting(false);
      setExtractError(t.pdfAudio.extractError);
    }
  }, [loadPdfFromBuffer, stopSpeech, t.pdfAudio.extractError]);

  useEffect(() => {
    if (autoLoadOfficial && segments.length === 0 && !extracting) {
      void handleLoadOfficialPdf();
    }
  }, [autoLoadOfficial, extracting, handleLoadOfficialPdf, segments.length]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await loadPdfFromBuffer(buffer, file.name);
    e.target.value = '';
  };

  const handlePlayOrResume = () => {
    if (!speechSupported || segments.length === 0) return;
    if (speechStatus === 'paused') {
      window.speechSynthesis.resume();
      setSpeechStatus('playing');
      return;
    }
    speakSegmentAt(activeIndex);
  };

  const handlePause = () => {
    if (!speechSupported || speechStatus !== 'playing') return;
    window.speechSynthesis.pause();
    setSpeechStatus('paused');
  };

  const handleSpeedChange = (nextRate: number) => {
    setRate(nextRate);
    rateRef.current = nextRate;
    if (speechStatus === 'playing') {
      speakSegmentAt(activeIndex);
    }
  };

  const currentSegment = segments[activeIndex] ?? null;

  const groupedVoices = useMemo(() => {
    const priorityPrefixes = ['pt', 'en', 'es'];
    return [...voices].sort((a, b) => {
      const aPri = priorityPrefixes.findIndex((p) => a.lang.toLowerCase().startsWith(p));
      const bPri = priorityPrefixes.findIndex((p) => b.lang.toLowerCase().startsWith(p));
      const aRank = aPri === -1 ? 99 : aPri;
      const bRank = bPri === -1 ? 99 : bPri;
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name);
    });
  }, [voices]);

  return (
    <div
      id="leitor-pdf-audio"
      className={`rounded-xl border border-[#D6CEBE] bg-white ${
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
      }`}
    >
      {/* Cabeçalho e fontes de PDF */}
      <div className="flex flex-col justify-between gap-5 border-b border-[#E2DDD3] pb-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-[#14532D]">
            <FileAudio className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.pdfAudio.kicker}</span>
          </p>
          <h3 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-[#1C1917]">
            {t.pdfAudio.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#44403C]">{t.pdfAudio.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLoadOfficialPdf}
            disabled={extracting}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>{t.pdfAudio.loadOfficialBtn}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={extracting}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#1C1917] transition-colors hover:bg-[#EFEBE3] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
            <span>{t.pdfAudio.uploadPdfBtn}</span>
          </button>
        </div>
      </div>

      {!speechSupported && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-xs font-medium text-[#991B1B]"
        >
          {t.pdfAudio.noSpeechSupport}
        </div>
      )}

      {extractError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-xs font-medium text-[#991B1B]"
        >
          {extractError}
        </div>
      )}

      {extracting && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-6 py-10 text-sm text-[#57534E]">
          <Loader2 className="h-5 w-5 animate-spin text-[#14532D]" aria-hidden="true" />
          <span>{t.pdfAudio.extracting}</span>
        </div>
      )}

      {/* Painel de controle de áudio + texto extraído */}
      {!extracting && segments.length > 0 && (
        <div className="mt-6 space-y-5">
          {/* Barra de controles de reprodução */}
          <div className="rounded-lg border border-[#D6CEBE] bg-[#FBF9F5] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-3.5 text-xs">
              <div className="min-w-0">
                <span className="text-[#78716C]">{t.pdfAudio.loadedDocLabel}: </span>
                <span className="font-semibold text-[#1C1917]">{documentTitle}</span>
              </div>
              <div className="font-mono tabular-nums text-[#57534E]">
                {t.pdfAudio.progressLabel}: {activeIndex + 1} / {segments.length} ·{' '}
                {t.pdfAudio.pageLabel} {currentSegment?.pageNumber ?? 1} {t.pdfAudio.ofLabel}{' '}
                {totalPages}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Botões Play / Pause / Stop */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePlayOrResume}
                  disabled={!speechSupported || speechStatus === 'playing'}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {speechStatus === 'paused' ? t.pdfAudio.resumeBtn : t.pdfAudio.playBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePause}
                  disabled={!speechSupported || speechStatus !== 'playing'}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-semibold text-[#1C1917] transition-colors hover:bg-[#EFEBE3] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.pdfAudio.pauseBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={stopSpeech}
                  disabled={!speechSupported || speechStatus === 'idle'}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-semibold text-[#9A3412] transition-colors hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.pdfAudio.stopBtn}</span>
                </button>
              </div>

              {/* Controle de velocidade e seleção de voz/idioma */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#57534E]">
                    {t.pdfAudio.speedLabel}:
                  </span>
                  <div
                    role="group"
                    aria-label={t.pdfAudio.speedLabel}
                    className="inline-flex rounded-md bg-[#E8E2D5] p-0.5"
                  >
                    {SPEED_OPTIONS.map((spd) => {
                      const active = rate === spd;
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`cursor-pointer rounded px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-white text-[#14532D] shadow-xs'
                              : 'text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="pdf-audio-lang"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#57534E]"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                    <span>{t.pdfAudio.voiceLabel}:</span>
                  </label>
                  <select
                    id="pdf-audio-lang"
                    value={speechLang}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSpeechLang(next);
                      speechLangRef.current = next;
                      setSelectedVoiceUri('');
                      selectedVoiceUriRef.current = '';
                      if (speechStatus === 'playing') {
                        speakSegmentAt(activeIndex);
                      }
                    }}
                    className="min-h-[36px] rounded-md border border-[#D6CEBE] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917]"
                  >
                    <option value="pt-BR">Português (PT-BR)</option>
                    <option value="en-US">English (EN-US)</option>
                    <option value="es-ES">Español (ES-ES)</option>
                  </select>

                  {groupedVoices.length > 0 && (
                    <select
                      aria-label={t.pdfAudio.voiceLabel}
                      value={selectedVoiceUri}
                      onChange={(e) => {
                        const uri = e.target.value;
                        setSelectedVoiceUri(uri);
                        selectedVoiceUriRef.current = uri;
                        if (speechStatus === 'playing') {
                          speakSegmentAt(activeIndex);
                        }
                      }}
                      className="min-h-[36px] max-w-[220px] truncate rounded-md border border-[#D6CEBE] bg-white px-2.5 py-1 text-xs text-[#1C1917]"
                    >
                      <option value="">{t.pdfAudio.defaultVoice}</option>
                      {groupedVoices.map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista do texto extraído com acompanhamento e destaque em tempo real */}
          <div className="space-y-2">
            <p className="text-xs text-[#57534E]">{t.pdfAudio.segmentHint}</p>
            <div
              className={`space-y-2 overflow-y-auto rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] p-4 ${
                compact ? 'max-h-[38vh]' : 'max-h-[420px]'
              }`}
            >
              {segments.map((seg, idx) => {
                const isActive = idx === activeIndex && speechStatus !== 'idle';
                const prevPage = idx > 0 ? segments[idx - 1].pageNumber : 0;
                const showPageDivider = seg.pageNumber !== prevPage;

                return (
                  <div key={seg.id}>
                    {showPageDivider && (
                      <div className="my-2 border-b border-[#D6CEBE] pb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#78716C] tabular-nums">
                        {t.pdfAudio.pageLabel} {seg.pageNumber} / {totalPages}
                      </div>
                    )}
                    <button
                      ref={(el) => {
                        segmentRefs.current[idx] = el;
                      }}
                      type="button"
                      onClick={() => speakSegmentAt(idx)}
                      className={`block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm leading-relaxed transition-colors ${
                        isActive
                          ? 'bg-[#DCFCE7] font-medium text-[#14532D] ring-1 ring-[#14532D]/40'
                          : idx === activeIndex
                            ? 'bg-white text-[#1C1917] ring-1 ring-[#D6CEBE]'
                            : 'text-[#44403C] hover:bg-white hover:text-[#1C1917]'
                      }`}
                    >
                      {seg.text}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!extracting && segments.length === 0 && !extractError && (
        <div className="mt-6 rounded-lg border border-dashed border-[#D6CEBE] bg-[#FBF9F5] px-6 py-8 text-center text-sm text-[#57534E]">
          {t.pdfAudio.emptyState}
        </div>
      )}
    </div>
  );
}
