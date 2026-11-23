import {
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Radio,
  RotateCcw,
  Save,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { OFFICIAL_ASSETS } from '../data/institutionalData';
import {
  compressBannerImageFile,
  RadioBannerConfig,
  sanitizeBannerImageUrl,
  sanitizeExternalRadioUrl,
  useRadioBannerStore,
} from '../data/radioBannerStore';

export function AdminRadioBannerPanel() {
  const { config, updateConfig, resetConfig } = useRadioBannerStore();
  const [draft, setDraft] = useState<RadioBannerConfig>(config);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);
    try {
      const compressedDataUrl = await compressBannerImageFile(file);
      setDraft((prev) => ({
        ...prev,
        bannerImageUrl: compressedDataUrl,
      }));
      setSuccessMsg('Foto do banner carregada na pré-visualização. Clique em Salvar para publicar.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar a foto do banner.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const safeUrl = sanitizeExternalRadioUrl(draft.listenUrl);
    const saved = updateConfig({
      ...draft,
      listenUrl: safeUrl,
      bannerImageUrl: sanitizeBannerImageUrl(draft.bannerImageUrl),
    });
    setDraft(saved);
    setSuccessMsg('Banner, foto e link da Rádio Boas Novas FM 96,3 publicados no portal!');
  };

  const handleReset = () => {
    setErrorMsg('');
    const restored = resetConfig();
    setDraft(restored);
    setSuccessMsg('Configuração padrão da Rádio Boas Novas FM 96,3 restaurada.');
  };

  const previewUrl = sanitizeExternalRadioUrl(draft.listenUrl);
  const previewImage = sanitizeBannerImageUrl(draft.bannerImageUrl);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
              Comunicação &amp; Rádio Missionária
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-slate-900">
              Banner e Link — Missionário Teodoro na Rádio Boas Novas FM 96,3
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Inclua ou atualize a foto do banner do Missionário Teodoro na rádio, o texto do
              programa Voz da Assembleia de Deus (Série Voz Missionária) e o link oficial do
              aplicativo.
            </p>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
            <span>Testar Link da Rádio</span>
          </a>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-2.5 text-xs font-medium text-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-md border border-[#14532D]/30 bg-[#F0FDF4] px-4 py-2.5 text-xs font-medium text-[#14532D]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Formulário de Edição */}
            <div className="space-y-4 lg:col-span-7">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Exibir espaço no portal público
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Controla se o banner da Rádio Boas Novas FM 96,3 aparece na página inicial.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#14532D] focus:ring-[#14532D]"
                  />
                  <span>{draft.enabled ? 'Ativo' : 'Oculto'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="radio-station-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nome da Rádio
                  </label>
                  <input
                    id="radio-station-name"
                    type="text"
                    value={draft.stationName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, stationName: e.target.value }))
                    }
                    className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="radio-presenter-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Missionário / Apresentador
                  </label>
                  <input
                    id="radio-presenter-name"
                    type="text"
                    value={draft.presenterName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, presenterName: e.target.value }))
                    }
                    className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="radio-program-title"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Título do Programa / Banner
                </label>
                <input
                  id="radio-program-title"
                  type="text"
                  value={draft.programTitle}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, programTitle: e.target.value }))
                  }
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="radio-description"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Texto de Convite / Descrição
                </label>
                <textarea
                  id="radio-description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="radio-listen-url"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Link do Aplicativo da Rádio Boas Novas FM 96,3 *
                </label>
                <input
                  id="radio-listen-url"
                  type="url"
                  required
                  value={draft.listenUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, listenUrl: e.target.value }))
                  }
                  placeholder="https://voxhdstore.com.br/radioboasnovasfm963"
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 font-mono text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="radio-cta-label"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Texto do Botão Principal
                  </label>
                  <input
                    id="radio-cta-label"
                    type="text"
                    value={draft.ctaLabel}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, ctaLabel: e.target.value }))
                    }
                    className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="radio-schedule-note"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Legenda / Horário (opcional)
                  </label>
                  <input
                    id="radio-schedule-note"
                    type="text"
                    value={draft.scheduleNote}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, scheduleNote: e.target.value }))
                    }
                    className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload / URL da Foto do Banner */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="radio-banner-image-url"
                    className="text-xs font-semibold text-slate-800"
                  >
                    Foto / Arte do Banner do Missionário Teodoro na Rádio
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
                    >
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{uploading ? 'Carregando...' : 'Enviar Foto do Dispositivo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          bannerImageUrl: OFFICIAL_ASSETS.leadershipInAction,
                        }))
                      }
                      className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Usar foto oficial atual
                    </button>
                  </div>
                </div>

                <input
                  id="radio-banner-image-url"
                  type="text"
                  value={draft.bannerImageUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, bannerImageUrl: e.target.value }))
                  }
                  placeholder="Cole a URL da imagem ou envie uma foto pelo botão acima"
                  className="min-h-[38px] w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-[11px] text-slate-800 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Restaurar Padrão</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salvar Banner e Link</span>
                </button>
              </div>
            </div>

            {/* Pré-visualização ao Vivo */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-slate-200 bg-[#FAFAFA] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D]">
                    <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pré-visualização do Banner</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {draft.enabled ? 'Visível no portal' : 'Oculto no portal'}
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-[#D4AF37]/40 bg-[#EFEBE3] aspect-[16/10]">
                  <img
                    src={previewImage}
                    alt={draft.bannerImageAlt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#E5C158]">
                      {draft.frequencyLabel}
                    </p>
                    <p className="font-serif text-sm font-semibold leading-snug">
                      {draft.presenterName} · {draft.stationName}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3.5 space-y-2">
                  <h3 className="font-serif text-sm font-semibold text-slate-900">
                    {draft.programTitle}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">{draft.description}</p>
                  <p className="truncate font-mono text-[11px] text-[#14532D]">{previewUrl}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
