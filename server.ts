import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatGeminiError(err: unknown): {
  status: number;
  message: string;
  isPaidKeyRequired?: boolean;
} {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw === "MISSING_GEMINI_API_KEY") {
    return {
      status: 500,
      message:
        "A chave GEMINI_API_KEY não está configurada no servidor. Verifique o painel Settings > Secrets.",
    };
  }

  const lower = raw.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota")
  ) {
    return {
      status: 429,
      isPaidKeyRequired: true,
      message:
        "Limite de cota atingido ou modelo exclusivo para chave com faturamento ativo. Se estiver utilizando um modelo pago como o gemini-nano-banana-2.1, selecione uma chave de API paga no painel Settings > Secrets.",
    };
  }

  if (
    lower.includes("403") ||
    lower.includes("permission_denied") ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid")
  ) {
    return {
      status: 403,
      isPaidKeyRequired: true,
      message:
        "Permissão negada ou chave de API inválida para este modelo. Verifique ou atualize sua chave no painel Settings > Secrets.",
    };
  }

  if (lower.includes("404") || lower.includes("not_found")) {
    return {
      status: 404,
      message:
        "Modelo solicitado não encontrado ou indisponível para a chave atual.",
    };
  }

  return {
    status: 500,
    message: raw || "Erro inesperado ao consultar o serviço de inteligência artificial.",
  };
}

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

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  updatedAt: string;
}

const VISITOR_FILE = path.resolve(__dirname, ".visitor-counter.json");

function readVisitorStats(): VisitorStats {
  try {
    if (fs.existsSync(VISITOR_FILE)) {
      const raw = fs.readFileSync(VISITOR_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<VisitorStats>;
      return {
        totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : 0,
        uniqueVisitors: typeof parsed.uniqueVisitors === "number" ? parsed.uniqueVisitors : 0,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      };
    }
  } catch {
    // Fallback to zeroed counter
  }
  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    updatedAt: new Date().toISOString(),
  };
}

function writeVisitorStats(stats: VisitorStats): void {
  try {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify(stats, null, 2), "utf-8");
  } catch {
    // Ignore disk write error in read-only environments
  }
}

interface EditaisReport {
  mode: "tjac_auto" | "cnae_completo" | "fluxo_continuo";
  text: string;
  sources: WebSourceResult[];
  searchQueries: string[];
  updatedAt: string;
  customFilter?: string;
}

const EDITAIS_CACHE_FILE = path.resolve(__dirname, ".editais-cache.json");

function readEditaisCache(): Record<string, EditaisReport> {
  try {
    if (fs.existsSync(EDITAIS_CACHE_FILE)) {
      const raw = fs.readFileSync(EDITAIS_CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, EditaisReport>;
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  } catch {
    // Ignore cache read error
  }
  return {};
}

function writeEditaisCache(cache: Record<string, EditaisReport>): void {
  try {
    fs.writeFileSync(EDITAIS_CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // Ignore disk write error
  }
}

const EDITAIS_SYSTEM_INSTRUCTION = `Você é um Especialista em Captação de Recursos para o Terceiro Setor, com foco exclusivo em segurança alimentar, assistência social e projetos comunitários (como ONGs de sopão, cozinhas solidárias e distribuição de refeições).

Sua tarefa é buscar, filtrar e apresentar editais abertos, chamadas públicas, fundos de investimento social privado e programas de doação de alimentos/recursos financeiros aplicáveis a uma ONG de sopão no Brasil.

PERFIL CNAE EXCLUSIVO DESTA ASSOCIAÇÃO (FILTRO OBRIGATÓRIO):
- Entidade: Associação Recanto Social Bom Pastor (Projeto Sopão)
- CNPJ: 33.314.701/0001-54 · Fundação: 26/02/2019 · Município: Plácido de Castro - AC
- CNAE Principal: 94.30-8-00 — Atividades de associações de defesa de direitos sociais
- CNAEs Secundários Compatíveis: 88.00-6-00 — Serviços de assistência social sem alojamento; 94.99-5-00 — Atividades associativas não especificadas anteriormente
- Título: Utilidade Pública Estadual do Acre (Lei Ordinária nº 3.809/2021)
- REGRA CNAE: Inclua APENAS editais, chamamentos e programas compatíveis com OSCs destes CNAEs (assistência social, segurança alimentar, defesa de direitos sociais, cozinhas comunitárias/sopão). Descarte editais exclusivos para outros CNAEs (saúde hospitalar, ensino superior, cultura pura, esporte profissional).

REGRAS DE BUSCA E FILTRAGEM:
1. Priorize editais com inscrições abertas no momento atual ou com previsão de abertura nos próximos 30 dias.
2. Considere editais governamentais (municipais, estaduais, federais, leis de incentivo, emendas, TJAC penas pecuniárias) e privados (institutos, fundações empresariais, bancos, supermercados, programas de mesa brasil/combate à fome).
3. Descarte editais que exijam CNPJ com mais de 5 anos caso não sejam a única opção, incluindo sempre oportunidades para organizações menores ou em estruturação.
4. Verifique sempre a elegibilidade para projetos de assistência alimentar e combate à fome.

FORMATO DE SAÍDA (OBRIGATÓRIO):
Sempre que receber um comando para atualizar ou buscar editais, responda exatamente neste formato de lista estruturada:

### 📌 [Nome do Edital ou Programa]
* **Instituição Financiadora:** [Nome do órgão ou empresa]
* **Tipo de Apoio:** [Recursos financeiros, doação de alimentos, equipamentos de cozinha, etc.]
* **Valor / Benefício:** [Valor máximo por projeto ou descrição do benefício]
* **Prazo de Inscrição:** [Data limite ou "Fluxo Contínuo"]
* **Abrangência:** [Nacional, Estadual ou Municipal]
* **Requisitos Básicos:** [Ex: CNPJ ativo, tempo mínimo de existência, estatuto, CNAE compatível]
* **Resumo do Objeto:** [1 frase explicando o que o edital financia]
* **Link / Onde Encontrar:** [Link direto ou termos exatos para busca no portal oficial]

---
Caso não encontre nenhum edital novo no momento, informe claramente e sugira 3 instituições que operam em fluxo contínuo (ex: Mesa Brasil Sesc, Instituto Assaí, Fundação Banco do Brasil) com o status atual delas.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get("/api/visitors", (_req: Request, res: Response) => {
    res.json(readVisitorStats());
  });

  app.post("/api/visitors/hit", (req: Request, res: Response) => {
    const body = req.body as { isNewVisitor?: boolean };
    const current = readVisitorStats();
    const updated: VisitorStats = {
      totalVisits: current.totalVisits + 1,
      uniqueVisitors: current.uniqueVisitors + (body?.isNewVisitor ? 1 : 0),
      updatedAt: new Date().toISOString(),
    };
    writeVisitorStats(updated);
    res.json(updated);
  });

  app.post("/api/visitors/reset", (_req: Request, res: Response) => {
    const reset: VisitorStats = {
      totalVisits: 0,
      uniqueVisitors: 0,
      updatedAt: new Date().toISOString(),
    };
    writeVisitorStats(reset);
    res.json(reset);
  });

  app.get("/api/editais", (req: Request, res: Response) => {
    const modeParam = typeof req.query.mode === "string" ? req.query.mode : "tjac_auto";
    const cache = readEditaisCache();
    res.json({
      report: cache[modeParam] ?? null,
      modesCached: Object.keys(cache),
    });
  });

  // Coleta Automática de Editais (TJAC + Filtro Exclusivo por CNAE da Associação)
  app.post("/api/gemini/editais", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        mode?: "tjac_auto" | "cnae_completo" | "fluxo_continuo";
        customFilter?: string;
      };
      const mode: "tjac_auto" | "cnae_completo" | "fluxo_continuo" =
        body?.mode === "cnae_completo" || body?.mode === "fluxo_continuo"
          ? body.mode
          : "tjac_auto";
      const customFilter = body?.customFilter?.trim() ?? "";
      const todayIso = new Date().toISOString().slice(0, 10);

      let searchPrompt = "";
      if (mode === "tjac_auto") {
        searchPrompt = `Data atual de referência: ${todayIso}.
Execute uma coleta automática e atualizada no portal oficial do Tribunal de Justiça do Estado do Acre (tjac.jus.br) e órgãos do Acre buscando editais abertos ou recentes de destinação de penas pecuniárias, chamadas públicas do TJAC (incluindo Comarca de Plácido de Castro e comarcas do Acre), e programas estaduais (SEASDH Acre) compatíveis EXCLUSIVAMENTE com os CNAEs da Associação Recanto Social Bom Pastor (94.30-8-00, 88.00-6-00, 94.99-5-00) para o Projeto Sopão / Cozinha Solidária.${
          customFilter ? ` Foco adicional solicitado: ${customFilter}.` : ""
        } Responda obrigatoriamente seguindo o FORMATO DE SAÍDA estruturado.`;
      } else if (mode === "fluxo_continuo") {
        searchPrompt = `Data atual de referência: ${todayIso}.
Busque e liste programas e fundos de apoio em FLUXO CONTÍNUO (ou chamadas recorrentes) de institutos privados, fundações, bancos, redes varejistas e Mesa Brasil Sesc aplicáveis EXCLUSIVAMENTE a ONGs de sopão / cozinhas solidárias com CNAE 94.30-8-00 ou 88.00-6-00 no Brasil e no Acre.${
          customFilter ? ` Foco adicional solicitado: ${customFilter}.` : ""
        } Responda obrigatoriamente seguindo o FORMATO DE SAÍDA estruturado.`;
      } else {
        searchPrompt = `Data atual de referência: ${todayIso}.
Busque editais abertos, chamadas públicas governamentais (municipais, estaduais no Acre, federais MDS/Cozinha Solidária) e fundos privados no Brasil aplicáveis EXCLUSIVAMENTE aos CNAEs 94.30-8-00 (defesa de direitos sociais) e 88.00-6-00 (assistência social sem alojamento) para ONG de sopão e assistência alimentar em Plácido de Castro - AC.${
          customFilter ? ` Foco adicional solicitado: ${customFilter}.` : ""
        } Responda obrigatoriamente seguindo o FORMATO DE SAÍDA estruturado.`;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: searchPrompt,
        config: {
          systemInstruction: EDITAIS_SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      const metadata = response.candidates?.[0]?.groundingMetadata as
        | {
            webSearchQueries?: string[];
            groundingChunks?: Array<{
              web?: { uri?: string; title?: string };
            }>;
          }
        | undefined;

      const sourcesMap = new Map<string, WebSourceResult>();
      for (const chunk of metadata?.groundingChunks ?? []) {
        if (chunk.web?.uri && !sourcesMap.has(chunk.web.uri)) {
          sourcesMap.set(chunk.web.uri, {
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }

      const report: EditaisReport = {
        mode,
        text: response.text ?? "",
        sources: Array.from(sourcesMap.values()),
        searchQueries: metadata?.webSearchQueries ?? [],
        updatedAt: new Date().toISOString(),
        ...(customFilter ? { customFilter } : {}),
      };

      const cache = readEditaisCache();
      cache[mode] = report;
      writeEditaisCache(cache);

      res.json(report);
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 1. Google Maps Grounding (gemini-4-hydrogen + googleMaps)
  app.post("/api/gemini/maps-grounding", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        query?: string;
        userLatLng?: { latitude?: number; longitude?: number };
      };
      const query = body?.query?.trim();
      if (!query) {
        res.status(400).json({ error: "Informe uma pergunta ou busca de localização." });
        return;
      }

      const ai = getAiClient();

      const hasCoords =
        typeof body.userLatLng?.latitude === "number" &&
        Number.isFinite(body.userLatLng.latitude) &&
        typeof body.userLatLng?.longitude === "number" &&
        Number.isFinite(body.userLatLng.longitude);

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: query,
        config: {
          systemInstruction:
            "Você é o assistente territorial da Associação Recanto Social Bom Pastor (Projeto Sopão), sediada na Rua Zuila Ferreira de Freitas, nº 933, Bairro Olaria, Plácido de Castro - AC (CEP 69928-000). Responda em português do Brasil de forma objetiva e útil para voluntários, doadores e logística de coleta/entrega, apoiando-se exclusivamente nos dados retornados pelo Google Maps.",
          tools: [{ googleMaps: {} }],
          ...(hasCoords
            ? {
                toolConfig: {
                  retrievalConfig: {
                    latLng: {
                      latitude: body.userLatLng!.latitude as number,
                      longitude: body.userLatLng!.longitude as number,
                    },
                  },
                },
              }
            : {}),
        },
      });

      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      const placesMap = new Map<string, MapsPlaceResult>();
      for (const chunk of rawChunks as Array<{
        maps?: {
          uri?: string;
          title?: string;
          placeId?: string;
          placeAnswerSources?: {
            reviewSnippets?: Array<{
              content?: string;
              uri?: string;
              authorAttribution?: { displayName?: string };
            }>;
          };
        };
      }>) {
        const m = chunk.maps;
        if (!m?.uri) continue;
        if (!placesMap.has(m.uri)) {
          const snippets = (m.placeAnswerSources?.reviewSnippets ?? []).map((s) => ({
            text: s.content,
            uri: s.uri,
            author: s.authorAttribution?.displayName,
          }));
          placesMap.set(m.uri, {
            title: m.title || "Local no Google Maps",
            uri: m.uri,
            placeId: m.placeId,
            reviewSnippets: snippets,
          });
        }
      }

      res.json({
        text: response.text ?? "",
        places: Array.from(placesMap.values()),
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Google Search Grounding (gemini-4-hydrogen + googleSearch)
  app.post("/api/gemini/search-grounding", async (req: Request, res: Response) => {
    try {
      const body = req.body as { query?: string };
      const query = body?.query?.trim();
      if (!query) {
        res.status(400).json({ error: "Informe um tema ou termo para pesquisar." });
        return;
      }

      const ai = getAiClient();

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: query,
        config: {
          systemInstruction:
            "Você é o assistente de pesquisa e transparência institucional da Associação Recanto Social Bom Pastor (Projeto Sopão), em Plácido de Castro, Acre. Utilize a busca do Google para fornecer informações atualizadas, verificáveis e claras em português do Brasil sobre legislação, editais públicos, segurança alimentar e referências locais.",
          tools: [{ googleSearch: {} }],
        },
      });

      const metadata = response.candidates?.[0]?.groundingMetadata as
        | {
            webSearchQueries?: string[];
            groundingChunks?: Array<{
              web?: { uri?: string; title?: string };
            }>;
          }
        | undefined;

      const sourcesMap = new Map<string, WebSourceResult>();
      for (const chunk of metadata?.groundingChunks ?? []) {
        if (chunk.web?.uri && !sourcesMap.has(chunk.web.uri)) {
          sourcesMap.set(chunk.web.uri, {
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }

      res.json({
        text: response.text ?? "",
        sources: Array.from(sourcesMap.values()),
        searchQueries: metadata?.webSearchQueries ?? [],
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Create & Edit Images (gemini-nano-banana-2.1)
  app.post("/api/gemini/image", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        prompt?: string;
        aspectRatio?: string;
        imageSize?: string;
        sourceImageBase64?: string;
        sourceImageMimeType?: string;
        useWebSearch?: boolean;
      };

      const prompt = body?.prompt?.trim();
      if (!prompt) {
        res.status(400).json({ error: "Descreva a imagem que deseja criar ou editar." });
        return;
      }

      const allowedRatios = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);
      const aspectRatio =
        body.aspectRatio && allowedRatios.has(body.aspectRatio)
          ? body.aspectRatio
          : "1:1";

      const allowedSizes = new Set(["1K", "2K", "4K"]);
      const imageSize =
        body.imageSize && allowedSizes.has(body.imageSize) ? body.imageSize : "1K";

      const parts: Array<
        | { text: string }
        | { inlineData: { data: string; mimeType: string } }
      > = [];

      if (body.sourceImageBase64 && body.sourceImageMimeType) {
        parts.push({
          inlineData: {
            data: body.sourceImageBase64,
            mimeType: body.sourceImageMimeType,
          },
        });
      }

      parts.push({ text: prompt });

      const ai = getAiClient();

      const response = await ai.models.generateContent({
        model: "gemini-nano-banana-2.1",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
          ...(body.useWebSearch
            ? {
                tools: [
                  {
                    googleSearch: {
                      searchTypes: {
                        webSearch: {},
                        imageSearch: {},
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      });

      let imageDataUrl: string | null = null;
      const textNotes: string[] = [];

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textNotes.push(part.text);
        }
      }

      if (!imageDataUrl) {
        res.status(502).json({
          error:
            textNotes.join(" ").trim() ||
            "O modelo não retornou nenhuma imagem para este comando. Tente reformular a descrição.",
        });
        return;
      }

      res.json({
        imageDataUrl,
        caption: textNotes.join("\n").trim(),
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({
        error: formatted.message,
        isPaidKeyRequired: Boolean(formatted.isPaidKeyRequired),
      });
    }
  });

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Build não encontrado. Execute npm run build.");
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
