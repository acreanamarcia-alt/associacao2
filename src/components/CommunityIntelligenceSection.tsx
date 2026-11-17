import {
  ArrowUpRight,
  Compass,
  Download,
  Globe,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  DOCUMENTARY_FIGURES,
  INSTITUTION_PROFILE,
  OFFICIAL_ASSETS,
} from '../data/institutionalData';
import { SimpleMarkdown } from './SimpleMarkdown';

export type IntelligenceTab = 'maps' | 'search' | 'studio';

interface MapsPlaceResult {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: Array<{
    text?: string;
    uri?: string;
    author?: string;
  }>;
}

interface WebSourceResult {
  title: string;
  uri: string;
}

export interface StudioPresetImage {
  src: string;
  label: string;
}

interface CommunityIntelligenceSectionProps {
  requestedTab?: IntelligenceTab;
  requestedImage?: StudioPresetImage | null;
  onClearRequestedImage?: () => void;
}

const MAPS_PRESETS = [
  'Mercados e atacadistas em Plácido de Castro - AC para compra de insumos do Projeto Sopão',
  'Como chegar na Rua Zuila Ferreira de Freitas, 933, Bairro Olaria, Plácido de Castro - AC',
  'Unidades de saúde, escolas e CRAS próximos ao Bairro Olaria em Plácido de Castro - AC',
  'Distância e rota entre Rio Branco e Plácido de Castro pela AC-040',
];

const SEARCH_PRESETS = [
  'Lei Estadual nº 3.809/2021 Acre Associação Recanto Social Bom Pastor',
  'Editais de segurança alimentar, cozinhas solidárias e penas pecuniárias TJAC Acre',
  'Programas da SEASDH Acre para organizações da sociedade civil',
  'Preços médios de arroz, feijão e farinha de trigo no Acre',
];

const IMAGE_PRESETS = [
  'Cartaz editorial solidário para campanha de arrecadação de alimentos do Projeto Sopão em Plácido de Castro, estilo xilogravura amazônica moderna e tipografia limpa em português',
  'Ilustração calorosa de voluntários preparando pão caseiro e sopa nutritiva em cozinha comunitária no Acre, luz natural da manhã, estilo documental',
  'Selo comemorativo de gratidão aos doadores mensais do Projeto Sopão — Bairro Olaria, tons verde floresta e papel artesanal',
];

async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível carregar a imagem selecionada.');
  }
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao ler os dados da imagem.'));
      }
    };
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.split(',')[1] ?? '';
  return { base64, mimeType };
}

export function CommunityIntelligenceSection({
  requestedTab,
  requestedImage,
  onClearRequestedImage,
}: CommunityIntelligenceSectionProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('maps');

  // Maps Grounding state
  const [mapsQuery, setMapsQuery] = useState(MAPS_PRESETS[0]);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [mapsAnswer, setMapsAnswer] = useState('');
  const [mapsPlaces, setMapsPlaces] = useState<MapsPlaceResult[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [geoStatus, setGeoStatus] = useState<string>('');

  // Search Grounding state
  const [searchQuery, setSearchQuery] = useState(SEARCH_PRESETS[0]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [searchSources, setSearchSources] = useState<WebSourceResult[]>([]);

  // Image Studio state
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '3:4' | '9:16'>('4:3');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [sourceImageLabel, setSourceImageLabel] = useState<string>('');
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState('');

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!requestedImage) return;
    let cancelled = false;
    setActiveTab('studio');
    setImageError('');
    setSourceImagePreview(requestedImage.src);
    setSourceImageLabel(requestedImage.label);
    imageUrlToBase64(requestedImage.src)
      .then(({ base64, mimeType }) => {
        if (cancelled) return;
        setSourceImageBase64(base64);
        setSourceImageMime(mimeType);
        if (!imagePrompt.trim()) {
          setImagePrompt(
            'Aprimore a iluminação natural desta foto documental e adicione no topo uma faixa discreta em verde-escuro com o título "PROJETO SOPÃO · PLÁCIDO DE CASTRO"'
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setImageError(err instanceof Error ? err.message : 'Erro ao carregar imagem do acervo.');
      });
    onClearRequestedImage?.();
    return () => {
      cancelled = true;
    };
  }, [requestedImage, onClearRequestedImage, imagePrompt]);

  const handleRequestGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('Geolocalização não disponível neste navegador.');
      return;
    }
    setGeoStatus('Obtendo localização atual...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoStatus(
          `Localização ativa (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        );
      },
      () => {
        setGeoStatus('Permissão de localização não concedida — consulta seguirá por endereço.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const runMapsQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    setMapsLoading(true);
    setMapsError('');
    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          ...(userCoords ? { userLatLng: userCoords } : {}),
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        places?: MapsPlaceResult[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao consultar dados do Google Maps.');
      }
      setMapsAnswer(data.text || '');
      setMapsPlaces(data.places || []);
    } catch (err) {
      setMapsError(err instanceof Error ? err.message : 'Falha ao consultar dados territoriais.');
    } finally {
      setMapsLoading(false);
    }
  };

  const handleMapsSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runMapsQuery(mapsQuery);
  };

  const runSearchQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await res.json()) as {
        text?: string;
        sources?: WebSourceResult[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar pesquisa na web.');
      }
      setSearchAnswer(data.text || '');
      setSearchSources(data.sources || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Falha na pesquisa Google.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runSearchQuery(searchQuery);
  };

  const handleUploadImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const base64 = reader.result.split(',')[1] ?? '';
      setSourceImagePreview(reader.result);
      setSourceImageLabel(file.name);
      setSourceImageBase64(base64);
      setSourceImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectArchiveImage = async (src: string, label: string) => {
    setImageError('');
    setSourceImagePreview(src);
    setSourceImageLabel(label);
    try {
      const { base64, mimeType } = await imageUrlToBase64(src);
      setSourceImageBase64(base64);
      setSourceImageMime(mimeType);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Erro ao carregar foto do acervo.');
    }
  };

  const clearSourceImage = () => {
    setSourceImagePreview(null);
    setSourceImageLabel('');
    setSourceImageBase64(null);
    setSourceImageMime(null);
  };

  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = imagePrompt.trim();
    if (!trimmed) {
      setImageError('Descreva a imagem que deseja criar ou a edição desejada.');
      return;
    }
    setImageLoading(true);
    setImageError('');
    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          aspectRatio,
          imageSize,
          useWebSearch,
          ...(sourceImageBase64 && sourceImageMime
            ? {
                sourceImageBase64,
                sourceImageMimeType: sourceImageMime,
              }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        imageDataUrl?: string;
        caption?: string;
        error?: string;
      };
      if (!res.ok || !data.imageDataUrl) {
        throw new Error(data.error || 'Não foi possível gerar ou editar a imagem.');
      }
      setGeneratedImageUrl(data.imageDataUrl);
      setGeneratedCaption(data.caption || '');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <section id="central-ia" className="border-b border-[#E2DDD3] bg-[#FBF9F5]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="flex flex-col justify-between gap-6 border-b border-[#D6CEBE] pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
              Central Territorial, Pesquisa &amp; Mídia Comunitária
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
              Localização no Google Maps, Pesquisa Pública e Estúdio de Imagens
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#44403C]">
              Consulte pontos de apoio e fornecedores em Plácido de Castro com dados atualizados do
              Google Maps, pesquise editais e legislação na web ou crie e edite peças visuais para
              as campanhas do Projeto Sopão.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Ferramentas de localização, pesquisa e criação de imagens"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#E8E2D5] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'maps'}
              onClick={() => setActiveTab('maps')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'maps'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
              <span>Dados Google Maps</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'search'}
              onClick={() => setActiveTab('search')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'search'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
              <span>Pesquisa Google</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'studio'}
              onClick={() => setActiveTab('studio')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'studio'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <ImagePlus className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
              <span>Criar &amp; Editar Imagens</span>
            </button>
          </div>
        </div>

        {/* TAB 1: GOOGLE MAPS GROUNDING */}
        {activeTab === 'maps' && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-5">
              <div className="rounded-lg border border-[#D6CEBE] bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
                      Referência da Sede
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                      Bairro Olaria · Plácido de Castro
                    </h3>
                  </div>
                  <Compass className="h-5 w-5 shrink-0 text-[#14532D]" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm text-[#44403C]">
                  {INSTITUTION_PROFILE.address}, {INSTITUTION_PROFILE.cityState} (
                  {INSTITUTION_PROFILE.cep}).
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EFEBE3] pt-4">
                  <button
                    type="button"
                    onClick={handleRequestGeolocation}
                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FBF9F5] px-3 py-1.5 text-xs font-semibold text-[#14532D] hover:bg-[#14532D] hover:text-white transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Usar minha localização</span>
                  </button>
                  {geoStatus && <span className="text-[11px] text-[#57534E]">{geoStatus}</span>}
                </div>
              </div>

              <div className="rounded-lg border border-[#D6CEBE] bg-[#F4F0E8] p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
                  Consultas Rápidas de Território
                </p>
                <div className="mt-3 space-y-2">
                  {MAPS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setMapsQuery(preset);
                        void runMapsQuery(preset);
                      }}
                      className="w-full cursor-pointer rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#1C1917] transition-colors hover:border-[#14532D] hover:bg-[#FBF9F5]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-7">
              <form
                onSubmit={handleMapsSubmit}
                className="rounded-lg border border-[#D6CEBE] bg-white p-6"
              >
                <label
                  htmlFor="maps-grounding-input"
                  className="block text-xs font-medium uppercase tracking-wider text-[#78716C]"
                >
                  Consultar lugares, endereços ou rotas com dados do Google Maps
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="maps-grounding-input"
                    type="text"
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="Ex.: Supermercados próximos ao Bairro Olaria em Plácido de Castro - AC"
                    className="min-h-[44px] flex-1 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3.5 py-2 text-sm text-[#1C1917]"
                  />
                  <button
                    type="submit"
                    disabled={mapsLoading}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {mapsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{mapsLoading ? 'Consultando...' : 'Consultar Maps'}</span>
                  </button>
                </div>

                {mapsError && (
                  <p role="alert" className="mt-3 text-xs font-medium text-[#9A3412]">
                    {mapsError}
                  </p>
                )}
              </form>

              {(mapsAnswer || mapsPlaces.length > 0) && (
                <div className="rounded-lg border border-[#D6CEBE] bg-white p-6 space-y-6">
                  {mapsAnswer && (
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#14532D]">
                        Resposta fundamentada no Google Maps
                      </p>
                      <div className="mt-2">
                        <SimpleMarkdown content={mapsAnswer} />
                      </div>
                    </div>
                  )}

                  {mapsPlaces.length > 0 && (
                    <div className="border-t border-[#EFEBE3] pt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                        Locais e Links Verificados no Google Maps ({mapsPlaces.length})
                      </p>
                      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {mapsPlaces.map((place) => (
                          <li
                            key={place.uri}
                            className="rounded-md border border-[#E2DDD3] bg-[#FBF9F5] p-3.5"
                          >
                            <a
                              href={place.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-start justify-between gap-2 text-sm font-semibold text-[#14532D] hover:underline underline-offset-4"
                            >
                              <span>{place.title}</span>
                              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            </a>
                            {place.reviewSnippets.length > 0 && (
                              <div className="mt-2 space-y-1.5 border-t border-[#EFEBE3] pt-2">
                                {place.reviewSnippets.slice(0, 2).map((snippet, idx) => (
                                  <div key={idx} className="text-xs text-[#57534E]">
                                    {snippet.text && <p className="italic">“{snippet.text}”</p>}
                                    {snippet.uri && (
                                      <a
                                        href={snippet.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-medium text-[#14532D] hover:underline"
                                      >
                                        {snippet.author ? `Avaliação de ${snippet.author}` : 'Ver avaliação no Maps'}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE SEARCH GROUNDING */}
        {activeTab === 'search' && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-lg border border-[#D6CEBE] bg-[#F4F0E8] p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
                  Temas Sugeridos para Consulta Pública
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                  Pesquise informações atualizadas da web sobre legislação estadual, editais,
                  cotações de alimentos e programas sociais no Acre.
                </p>
                <div className="mt-4 space-y-2">
                  {SEARCH_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSearchQuery(preset);
                        void runSearchQuery(preset);
                      }}
                      className="w-full cursor-pointer rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#1C1917] transition-colors hover:border-[#14532D] hover:bg-[#FBF9F5]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-7">
              <form
                onSubmit={handleSearchSubmit}
                className="rounded-lg border border-[#D6CEBE] bg-white p-6"
              >
                <label
                  htmlFor="search-grounding-input"
                  className="block text-xs font-medium uppercase tracking-wider text-[#78716C]"
                >
                  Pesquisar dados atualizados na Busca do Google
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="search-grounding-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex.: Editais de segurança alimentar ou Lei 3.809/2021 Acre"
                    className="min-h-[44px] flex-1 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3.5 py-2 text-sm text-[#1C1917]"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{searchLoading ? 'Pesquisando...' : 'Pesquisar na Web'}</span>
                  </button>
                </div>

                {searchError && (
                  <p role="alert" className="mt-3 text-xs font-medium text-[#9A3412]">
                    {searchError}
                  </p>
                )}
              </form>

              {(searchAnswer || searchSources.length > 0) && (
                <div className="rounded-lg border border-[#D6CEBE] bg-white p-6 space-y-6">
                  {searchAnswer && (
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#14532D]">
                        Síntese fundamentada na Busca Google
                      </p>
                      <div className="mt-2">
                        <SimpleMarkdown content={searchAnswer} />
                      </div>
                    </div>
                  )}

                  {searchSources.length > 0 && (
                    <div className="border-t border-[#EFEBE3] pt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                        Fontes da Web ({searchSources.length})
                      </p>
                      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {searchSources.map((src) => (
                          <li key={src.uri}>
                            <a
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 rounded-md border border-[#E2DDD3] bg-[#FBF9F5] px-3.5 py-2.5 text-xs font-medium text-[#14532D] hover:border-[#14532D] hover:bg-white"
                            >
                              <span className="truncate">{src.title}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: IMAGE STUDIO (CREATE & EDIT WITH gemini-nano-banana-2.1) */}
        {activeTab === 'studio' && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleGenerateImage}
              className="space-y-5 rounded-lg border border-[#D6CEBE] bg-white p-6 lg:col-span-6"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-[#9A3412]">
                  Modelo gemini-nano-banana-2.1
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]">
                  Criar ou Editar Peças Visuais
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                  Gere cartazes e ilustrações para campanhas do Projeto Sopão ou carregue uma foto
                  do acervo para editá-la por texto.
                </p>
              </div>

              {/* Optional Source Image for Editing */}
              <div className="rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Imagem base para edição (opcional)
                  </span>
                  {sourceImagePreview && (
                    <button
                      type="button"
                      onClick={clearSourceImage}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#9A3412] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remover base (criar do zero)</span>
                    </button>
                  )}
                </div>

                {sourceImagePreview ? (
                  <div className="flex items-center gap-3 rounded border border-[#D6CEBE] bg-white p-2.5">
                    <img
                      src={sourceImagePreview}
                      alt="Imagem selecionada para edição"
                      className="h-16 w-20 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#1C1917]">
                        {sourceImageLabel || 'Imagem selecionada'}
                      </p>
                      <p className="text-[11px] text-[#57534E]">
                        Modo ativo: edição guiada por texto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#EFEBE3]">
                      <Upload className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                      <span>Enviar foto do dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleUploadImage(e.target.files?.[0])}
                      />
                    </label>

                    <div>
                      <p className="text-[11px] text-[#78716C]">
                        Ou selecione uma imagem do acervo oficial para editar:
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleSelectArchiveImage(OFFICIAL_ASSETS.logo, 'Logo Oficial')
                          }
                          className="cursor-pointer rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1C1917] hover:border-[#14532D]"
                        >
                          Logo Oficial
                        </button>
                        {DOCUMENTARY_FIGURES.slice(0, 4).map((fig) => (
                          <button
                            key={fig.id}
                            type="button"
                            onClick={() =>
                              void handleSelectArchiveImage(
                                fig.imageSrc,
                                `${fig.number} — ${fig.title}`
                              )
                            }
                            className="cursor-pointer rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1C1917] hover:border-[#14532D]"
                          >
                            {fig.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="studio-prompt"
                  className="block text-xs font-medium text-[#44403C]"
                >
                  {sourceImagePreview
                    ? 'Instrução de edição em texto'
                    : 'Descrição da imagem a criar'}
                </label>
                <textarea
                  id="studio-prompt"
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Ex.: Crie um cartaz acolhedor para o Mutirão de Arrecadação do Projeto Sopão em Plácido de Castro..."
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] p-3 text-sm text-[#1C1917]"
                />
                {!sourceImagePreview && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImagePrompt(preset)}
                        className="cursor-pointer rounded border border-[#E2DDD3] bg-[#F4F0E8] px-2.5 py-1 text-[11px] font-medium text-[#44403C] hover:border-[#14532D]"
                      >
                        Ideia {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="studio-ratio"
                    className="block text-xs font-medium text-[#44403C]"
                  >
                    Proporção
                  </label>
                  <select
                    id="studio-ratio"
                    value={aspectRatio}
                    onChange={(e) =>
                      setAspectRatio(
                        e.target.value as '1:1' | '4:3' | '16:9' | '3:4' | '9:16'
                      )
                    }
                    className="mt-1 min-h-[42px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3 text-sm text-[#1C1917]"
                  >
                    <option value="1:1">1:1 (Quadrado)</option>
                    <option value="4:3">4:3 (Editorial)</option>
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="3:4">3:4 (Cartaz Vertical)</option>
                    <option value="9:16">9:16 (Stories)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="studio-size"
                    className="block text-xs font-medium text-[#44403C]"
                  >
                    Resolução
                  </label>
                  <select
                    id="studio-size"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as '1K' | '2K')}
                    className="mt-1 min-h-[42px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3 text-sm text-[#1C1917]"
                  >
                    <option value="1K">1K (Padrão rápido)</option>
                    <option value="2K">2K (Alta definição)</option>
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-[#44403C]">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D6CEBE] accent-[#14532D]"
                />
                <span>Usar referências visuais da Busca Google ao gerar</span>
              </label>

              {imageError && (
                <div
                  role="alert"
                  className="rounded-md border border-[#9A3412]/30 bg-[#FEF2F2] p-3 text-xs leading-relaxed text-[#9A3412]"
                >
                  {imageError}
                </div>
              )}

              <button
                type="submit"
                disabled={imageLoading}
                className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] disabled:opacity-60"
              >
                {imageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {imageLoading
                    ? 'Processando imagem...'
                    : sourceImagePreview
                      ? 'Aplicar Edição com IA'
                      : 'Gerar Imagem com IA'}
                </span>
              </button>
            </form>

            <div className="flex flex-col justify-between rounded-lg border border-[#D6CEBE] bg-white p-6 lg:col-span-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
                  Pré-visualização do Resultado
                </p>

                <div className="mt-4 flex min-h-[340px] items-center justify-center overflow-hidden rounded-lg border border-[#E2DDD3] bg-[#EFEBE3] p-4">
                  {imageLoading ? (
                    <div className="flex flex-col items-center gap-3 text-center text-sm text-[#57534E]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#9A3412]" />
                      <p>Compondo imagem em alta definição...</p>
                    </div>
                  ) : generatedImageUrl ? (
                    <img
                      src={generatedImageUrl}
                      alt="Imagem gerada ou editada para o Projeto Sopão"
                      className="max-h-[420px] w-auto rounded object-contain shadow-sm"
                    />
                  ) : (
                    <div className="max-w-xs text-center text-xs leading-relaxed text-[#78716C]">
                      <ImagePlus className="mx-auto mb-2 h-8 w-8 text-[#A8A29E]" />
                      <p>
                        Descreva uma arte nova ou escolha uma foto do acervo à esquerda para criar
                        ou editar materiais de divulgação da Associação.
                      </p>
                    </div>
                  )}
                </div>

                {generatedCaption && (
                  <p className="mt-3 text-xs leading-relaxed text-[#57534E]">{generatedCaption}</p>
                )}
              </div>

              {generatedImageUrl && (
                <div className="mt-4 flex justify-end border-t border-[#EFEBE3] pt-4">
                  <a
                    href={generatedImageUrl}
                    download={`projeto-sopao-${Date.now()}.png`}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#14532D] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#14532D] hover:bg-[#14532D] hover:text-white transition-colors"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Baixar Imagem (PNG)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
