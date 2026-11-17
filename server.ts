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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
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
