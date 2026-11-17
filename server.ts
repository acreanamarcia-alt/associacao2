import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
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
  mode: "tjac_auto" | "cnae_completo" | "fluxo_continuo" | "leis_emendas";
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

const ADMIN_AUTH_FILE = path.resolve(__dirname, ".admin-auth.json");
const ADMIN_COOKIE_NAME = "arsbp_admin_session";
const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@bompastor.org.br";
const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || "BomPastor@2026";

type UserRole = "admin" | "gerente" | "usuario";
type UserStatus = "ativo" | "inativo";

const VALID_ROLES = new Set<UserRole>(["admin", "gerente", "usuario"]);

function normalizeRole(rawRole?: string): UserRole {
  if (!rawRole) return "usuario";
  const lower = rawRole.trim().toLowerCase();
  if (lower === "admin" || lower === "super_admin") return "admin";
  if (
    lower === "gerente" ||
    lower === "editor" ||
    lower === "financeiro" ||
    lower === "operacional" ||
    lower === "captacao"
  ) {
    return "gerente";
  }
  return "usuario";
}

function normalizeStatus(rawStatus?: string, legacyActive?: boolean): UserStatus {
  if (rawStatus === "inativo" || rawStatus === "inactive") return "inativo";
  if (rawStatus === "ativo" || rawStatus === "active") return "ativo";
  if (typeof legacyActive === "boolean") {
    return legacyActive ? "ativo" : "inativo";
  }
  return "ativo";
}

interface UserAccountRecord {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  isDefaultPassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface StoredAuthDatabase {
  sessionSecret: string;
  users: UserAccountRecord[];
}

interface AuthenticatedRequest extends Request {
  authUser?: UserAccountRecord;
  authDb?: StoredAuthDatabase;
}

function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function sanitizePublicUser(user: UserAccountRecord) {
  return {
    id: user.id,
    nome: user.nome,
    displayName: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    active: user.status === "ativo",
    isDefaultPassword: user.isDefaultPassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function readOrInitAuthDb(): StoredAuthDatabase {
  try {
    if (fs.existsSync(ADMIN_AUTH_FILE)) {
      const raw = fs.readFileSync(ADMIN_AUTH_FILE, "utf-8");
      interface RawStoredUser {
        id?: string;
        nome?: string;
        name?: string;
        email?: string;
        role?: string;
        status?: string;
        active?: boolean;
        passwordHash?: string;
        isDefaultPassword?: boolean;
        createdAt?: string;
        updatedAt?: string;
        lastLoginAt?: string | null;
      }

      const parsed = JSON.parse(raw) as {
        sessionSecret?: string;
        users?: RawStoredUser[];
        email?: string;
        displayName?: string;
        passwordHash?: string;
        isDefaultPassword?: boolean;
        updatedAt?: string;
      };

      if (
        typeof parsed.sessionSecret === "string" &&
        Array.isArray(parsed.users) &&
        parsed.users.length > 0
      ) {
        const users: UserAccountRecord[] = parsed.users
          .filter(
            (u): u is RawStoredUser & {
              id: string;
              email: string;
              passwordHash: string;
            } =>
              Boolean(u) &&
              typeof u.id === "string" &&
              typeof u.email === "string" &&
              typeof u.passwordHash === "string"
          )
          .map((u) => ({
            id: u.id,
            nome: (u.nome || u.name || "Usuário").trim(),
            email: u.email.trim().toLowerCase(),
            role: normalizeRole(u.role),
            status: normalizeStatus(u.status, u.active),
            passwordHash: u.passwordHash,
            isDefaultPassword: Boolean(u.isDefaultPassword),
            createdAt: u.createdAt || new Date().toISOString(),
            updatedAt: u.updatedAt || new Date().toISOString(),
            lastLoginAt: typeof u.lastLoginAt === "string" ? u.lastLoginAt : null,
          }));

        if (users.length > 0) {
          return {
            sessionSecret: parsed.sessionSecret,
            users,
          };
        }
      }

      if (
        typeof parsed.email === "string" &&
        typeof parsed.passwordHash === "string" &&
        typeof parsed.sessionSecret === "string"
      ) {
        const now = new Date().toISOString();
        const migrated: StoredAuthDatabase = {
          sessionSecret: parsed.sessionSecret,
          users: [
            {
              id: "usr-admin-root",
              nome: parsed.displayName || "Diretoria · Projeto Sopão",
              email: parsed.email.trim().toLowerCase(),
              role: "admin",
              status: "ativo",
              passwordHash: parsed.passwordHash,
              isDefaultPassword: Boolean(parsed.isDefaultPassword),
              createdAt: parsed.updatedAt || now,
              updatedAt: parsed.updatedAt || now,
              lastLoginAt: null,
            },
          ],
        };
        writeAuthDb(migrated);
        return migrated;
      }
    }
  } catch {
    // Fallback to initial database
  }

  const now = new Date().toISOString();
  const initial: StoredAuthDatabase = {
    sessionSecret:
      process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString("hex"),
    users: [
      {
        id: "usr-admin-root",
        nome: "Diretoria · Projeto Sopão",
        email: DEFAULT_ADMIN_EMAIL,
        role: "admin",
        status: "ativo",
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        isDefaultPassword: !process.env.ADMIN_PASSWORD,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      },
    ],
  };

  writeAuthDb(initial);
  return initial;
}

function writeAuthDb(db: StoredAuthDatabase): void {
  try {
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Ignore read-only filesystem errors
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

function createJwtToken(user: UserAccountRecord, secret: string): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url"
  );
  const payloadObj: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: nowSec,
    exp: nowSec + 60 * 60 * 24 * 7, // 7 dias
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function verifyJwtUser(
  token: string | undefined,
  db: StoredAuthDatabase
): UserAccountRecord | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payloadB64, sig] = parts;
  if (!header || !payloadB64 || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", db.sessionSecret)
      .update(`${header}.${payloadB64}`)
      .digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    ) as Partial<JwtPayload>;
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      !payload ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      nowSec > payload.exp
    ) {
      return null;
    }

    const user = db.users.find(
      (u) =>
        u.id === payload.sub &&
        u.email.toLowerCase() === payload.email!.toLowerCase()
    );
    if (!user || user.status !== "ativo") return null;
    return user;
  } catch {
    return null;
  }
}

function extractTokenFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === "string") {
    for (const part of cookieHeader.split(";")) {
      const [rawKey, ...rawVal] = part.trim().split("=");
      if (rawKey === ADMIN_COOKIE_NAME) {
        return decodeURIComponent(rawVal.join("="));
      }
    }
  }
  return undefined;
}

// Middleware de proteção: valida JWT e verifica conta ativa
function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const db = readOrInitAuthDb();
  const token = extractTokenFromRequest(req);
  const currentUser = verifyJwtUser(token, db);
  if (!currentUser) {
    res.status(401).json({
      error: "Sessão ausente ou expirada. Faça login novamente.",
    });
    return;
  }
  req.authUser = currentUser;
  req.authDb = db;
  next();
}

// Middleware RBAC: exige uma das roles permitidas
function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "Autenticação necessária." });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: `Acesso negado para o nível "${user.role}". Permissão necessária: ${allowedRoles.join(" ou ")}.`,
      });
      return;
    }
    next();
  };
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): { allowed: boolean; retrySeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }
  if (entry.count >= 12) {
    return {
      allowed: false,
      retrySeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Inicializa banco RBAC na primeira execução
  readOrInitAuthDb();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Consulta de sessão atual (/api/auth/me e alias /api/admin/auth/session)
  const handleGetSession = (req: Request, res: Response) => {
    const db = readOrInitAuthDb();
    const token = extractTokenFromRequest(req);
    const activeUser = verifyJwtUser(token, db);
    const defaultRoot = db.users.find(
      (u) => u.role === "admin" && u.isDefaultPassword && u.status === "ativo"
    );

    if (!activeUser) {
      res.json({
        authenticated: false,
        defaultLoginAvailable: Boolean(defaultRoot),
        defaultEmailHint: defaultRoot ? defaultRoot.email : undefined,
      });
      return;
    }

    const sanitized = sanitizePublicUser(activeUser);
    res.json({
      authenticated: true,
      user: sanitized,
      admin: sanitized,
    });
  };

  app.get("/api/auth/me", handleGetSession);
  app.get("/api/admin/auth/session", handleGetSession);

  // 2. Cadastro público (/api/auth/register) - atribui role padrão "usuario"
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const body = req.body as {
      nome?: string;
      name?: string;
      email?: string;
      password?: string;
    };

    const nome = (body?.nome ?? body?.name ?? "").trim();
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (nome.length < 3) {
      res.status(400).json({
        error: "Informe seu nome completo (mínimo de 3 caracteres).",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: "Informe um endereço de e-mail válido.",
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({
        error: "A senha deve possuir no mínimo 6 caracteres.",
      });
      return;
    }

    const db = readOrInitAuthDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({
        error: "Já existe uma conta cadastrada com este e-mail.",
      });
      return;
    }

    const now = new Date().toISOString();
    const createdUser: UserAccountRecord = {
      id: `usr-${crypto.randomBytes(6).toString("hex")}`,
      nome,
      email,
      // Segurança: auto-cadastro público recebe obrigatoriamente role "usuario"
      role: "usuario",
      status: "ativo",
      passwordHash: hashPassword(password),
      isDefaultPassword: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    db.users = [createdUser, ...db.users];
    writeAuthDb(db);

    const token = createJwtToken(createdUser, db.sessionSecret);
    setSessionCookie(res, token);
    const sanitized = sanitizePublicUser(createdUser);

    res.status(201).json({
      authenticated: true,
      token,
      user: sanitized,
      admin: sanitized,
    });
  });

  // 3. Login com credenciais (/api/auth/login e alias /api/admin/auth/login)
  const handleLogin = (req: Request, res: Response) => {
    const ip = req.ip || "local";
    const rate = checkLoginRateLimit(ip);
    if (!rate.allowed) {
      res.status(429).json({
        error: `Muitas tentativas de login. Aguarde ${rate.retrySeconds} segundos e tente novamente.`,
      });
      return;
    }

    const body = req.body as { email?: string; password?: string };
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!email || !password) {
      res.status(400).json({ error: "Informe o e-mail e a senha de acesso." });
      return;
    }

    const db = readOrInitAuthDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordFailedLogin(ip);
      res.status(401).json({
        error: "E-mail ou senha inválidos. Verifique os dados informados.",
      });
      return;
    }

    if (user.status !== "ativo") {
      res.status(403).json({
        error:
          "Esta conta está inativa. Solicite a reativação ao Administrador do sistema.",
      });
      return;
    }

    clearLoginAttempts(ip);

    const now = new Date().toISOString();
    const updatedUser: UserAccountRecord = {
      ...user,
      lastLoginAt: now,
    };
    db.users = db.users.map((u) => (u.id === user.id ? updatedUser : u));
    writeAuthDb(db);

    const token = createJwtToken(updatedUser, db.sessionSecret);
    setSessionCookie(res, token);
    const sanitized = sanitizePublicUser(updatedUser);

    res.json({
      authenticated: true,
      token,
      user: sanitized,
      admin: sanitized,
    });
  };

  app.post("/api/auth/login", handleLogin);
  app.post("/api/admin/auth/login", handleLogin);

  // 4. Logout (/api/auth/logout e alias /api/admin/auth/logout)
  const handleLogout = (_req: Request, res: Response) => {
    res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  };

  app.post("/api/auth/logout", handleLogout);
  app.post("/api/admin/auth/logout", handleLogout);

  // 5. Atualização da própria conta (qualquer usuário autenticado)
  const handleUpdateSelfCredentials = (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const currentUser = req.authUser!;
    const db = req.authDb!;

    const body = req.body as {
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
      displayName?: string;
      nome?: string;
    };

    const currentPassword = body?.currentPassword ?? "";
    if (!verifyPassword(currentPassword, currentUser.passwordHash)) {
      res.status(403).json({ error: "A senha atual informada está incorreta." });
      return;
    }

    const nextEmail = body?.newEmail?.trim().toLowerCase() || currentUser.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      res.status(400).json({ error: "Informe um endereço de e-mail válido." });
      return;
    }

    const emailTaken = db.users.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === nextEmail
    );
    if (emailTaken) {
      res.status(409).json({
        error: "Este e-mail já está em uso por outro usuário cadastrado.",
      });
      return;
    }

    const nextPasswordRaw = body?.newPassword?.trim() || "";
    if (nextPasswordRaw && nextPasswordRaw.length < 6) {
      res
        .status(400)
        .json({ error: "A nova senha deve possuir pelo menos 6 caracteres." });
      return;
    }

    const nextNome = (body?.nome ?? body?.displayName)?.trim() || currentUser.nome;
    if (nextNome.length < 3) {
      res
        .status(400)
        .json({ error: "O nome deve possuir pelo menos 3 caracteres." });
      return;
    }

    const updatedUser: UserAccountRecord = {
      ...currentUser,
      email: nextEmail,
      nome: nextNome,
      passwordHash: nextPasswordRaw
        ? hashPassword(nextPasswordRaw)
        : currentUser.passwordHash,
      isDefaultPassword: nextPasswordRaw ? false : currentUser.isDefaultPassword,
      updatedAt: new Date().toISOString(),
    };

    db.users = db.users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    writeAuthDb(db);

    const freshToken = createJwtToken(updatedUser, db.sessionSecret);
    setSessionCookie(res, freshToken);
    const sanitized = sanitizePublicUser(updatedUser);

    res.json({
      authenticated: true,
      token: freshToken,
      user: sanitized,
      admin: sanitized,
    });
  };

  app.post("/api/auth/credentials", requireAuth, handleUpdateSelfCredentials);
  app.post("/api/admin/auth/credentials", requireAuth, handleUpdateSelfCredentials);

  // 6. Gestão RBAC de Usuários (/api/admin/users)
  // GET: leitura permitida para admin e gerente (suporta busca, filtro de role/status e paginação)
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRole("admin", "gerente"),
    (req: AuthenticatedRequest, res: Response) => {
      const db = req.authDb!;
      const q =
        typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
      const roleFilter =
        typeof req.query.role === "string" ? req.query.role.trim().toLowerCase() : "";
      const statusFilter =
        typeof req.query.status === "string"
          ? req.query.status.trim().toLowerCase()
          : "";
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

      const metrics = {
        total: db.users.length,
        ativos: db.users.filter((u) => u.status === "ativo").length,
        inativos: db.users.filter((u) => u.status === "inativo").length,
        byRole: {
          admin: db.users.filter((u) => u.role === "admin").length,
          gerente: db.users.filter((u) => u.role === "gerente").length,
          usuario: db.users.filter((u) => u.role === "usuario").length,
        },
      };

      const filtered = db.users.filter((u) => {
        const matchesQuery =
          !q ||
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q);
        const matchesRole =
          !roleFilter ||
          roleFilter === "todos" ||
          u.role === roleFilter;
        const matchesStatus =
          !statusFilter ||
          statusFilter === "todos" ||
          u.status === statusFilter;
        return matchesQuery && matchesRole && matchesStatus;
      });

      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIndex = (safePage - 1) * pageSize;
      const paginated = filtered.slice(startIndex, startIndex + pageSize);

      res.json({
        users: paginated.map(sanitizePublicUser),
        metrics,
        pagination: {
          page: safePage,
          pageSize,
          totalItems,
          totalPages,
        },
      });
    }
  );

  // POST: criar usuário com definição de role (somente admin)
  app.post(
    "/api/admin/users",
    requireAuth,
    requireRole("admin"),
    (req: AuthenticatedRequest, res: Response) => {
      const db = req.authDb!;
      const body = req.body as {
        nome?: string;
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        status?: string;
        active?: boolean;
      };

      const nome = (body?.nome ?? body?.name ?? "").trim();
      const email = body?.email?.trim().toLowerCase() ?? "";
      const password = body?.password ?? "";
      const role: UserRole =
        body?.role && VALID_ROLES.has(body.role as UserRole)
          ? (body.role as UserRole)
          : "usuario";
      const status = normalizeStatus(body?.status, body?.active);

      if (nome.length < 3) {
        res
          .status(400)
          .json({ error: "Informe o nome completo (mínimo 3 caracteres)." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: "Informe um e-mail válido para o login." });
        return;
      }
      if (password.length < 6) {
        res
          .status(400)
          .json({ error: "A senha inicial deve ter no mínimo 6 caracteres." });
        return;
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        res
          .status(409)
          .json({ error: "Já existe um usuário cadastrado com este e-mail." });
        return;
      }

      const now = new Date().toISOString();
      const created: UserAccountRecord = {
        id: `usr-${crypto.randomBytes(6).toString("hex")}`,
        nome,
        email,
        role,
        status,
        passwordHash: hashPassword(password),
        isDefaultPassword: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      };

      db.users = [created, ...db.users];
      writeAuthDb(db);

      res.status(201).json({
        user: sanitizePublicUser(created),
      });
    }
  );

  // PATCH: alterar role, status (ativo/inativo), dados ou redefinir senha (somente admin)
  app.patch(
    "/api/admin/users/:id",
    requireAuth,
    requireRole("admin"),
    (req: AuthenticatedRequest, res: Response) => {
      const currentUser = req.authUser!;
      const db = req.authDb!;
      const targetId = req.params.id;
      const target = db.users.find((u) => u.id === targetId);

      if (!target) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const body = req.body as {
        nome?: string;
        name?: string;
        email?: string;
        role?: string;
        status?: string;
        active?: boolean;
        newPassword?: string;
      };

      const nextRole: UserRole =
        body?.role && VALID_ROLES.has(body.role as UserRole)
          ? (body.role as UserRole)
          : target.role;
      const nextStatus: UserStatus =
        body?.status || typeof body?.active === "boolean"
          ? normalizeStatus(body?.status, body?.active)
          : target.status;
      const nextEmail = body?.email ? body.email.trim().toLowerCase() : target.email;
      const nextNome =
        body?.nome || body?.name
          ? (body?.nome ?? body?.name ?? "").trim()
          : target.nome;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        res.status(400).json({ error: "E-mail inválido." });
        return;
      }
      if (nextNome.length < 3) {
        res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres." });
        return;
      }
      if (
        db.users.some(
          (u) => u.id !== target.id && u.email.toLowerCase() === nextEmail
        )
      ) {
        res.status(409).json({ error: "E-mail já utilizado por outro usuário." });
        return;
      }

      if (target.id === currentUser.id && nextStatus === "inativo") {
        res.status(400).json({
          error: "Você não pode desativar a sua própria conta enquanto estiver conectado.",
        });
        return;
      }

      const activeAdminsAfter = db.users.filter((u) => {
        const r = u.id === target.id ? nextRole : u.role;
        const s = u.id === target.id ? nextStatus : u.status;
        return r === "admin" && s === "ativo";
      });

      if (activeAdminsAfter.length === 0) {
        res.status(400).json({
          error:
            "É obrigatório manter ao menos um Administrador (admin) ativo no sistema.",
        });
        return;
      }

      const nextPasswordRaw = body?.newPassword?.trim() || "";
      if (nextPasswordRaw && nextPasswordRaw.length < 6) {
        res
          .status(400)
          .json({ error: "A nova senha deve possuir no mínimo 6 caracteres." });
        return;
      }

      const updated: UserAccountRecord = {
        ...target,
        nome: nextNome,
        email: nextEmail,
        role: nextRole,
        status: nextStatus,
        passwordHash: nextPasswordRaw
          ? hashPassword(nextPasswordRaw)
          : target.passwordHash,
        isDefaultPassword: nextPasswordRaw ? false : target.isDefaultPassword,
        updatedAt: new Date().toISOString(),
      };

      db.users = db.users.map((u) => (u.id === target.id ? updated : u));
      writeAuthDb(db);

      res.json({
        user: sanitizePublicUser(updated),
      });
    }
  );

  // DELETE: remover usuário (somente admin)
  app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireRole("admin"),
    (req: AuthenticatedRequest, res: Response) => {
      const currentUser = req.authUser!;
      const db = req.authDb!;
      const targetId = req.params.id;

      if (targetId === currentUser.id) {
        res.status(400).json({
          error:
            "Você não pode excluir o seu próprio usuário enquanto estiver conectado.",
        });
        return;
      }

      const target = db.users.find((u) => u.id === targetId);
      if (!target) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const remainingActiveAdmins = db.users.filter(
        (u) => u.id !== target.id && u.role === "admin" && u.status === "ativo"
      );
      if (remainingActiveAdmins.length === 0) {
        res.status(400).json({
          error: "Não é possível remover o único Administrador ativo do sistema.",
        });
        return;
      }

      db.users = db.users.filter((u) => u.id !== target.id);
      writeAuthDb(db);

      res.json({ ok: true });
    }
  );

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
        mode?: "tjac_auto" | "cnae_completo" | "fluxo_continuo" | "leis_emendas";
        customFilter?: string;
      };
      const mode: "tjac_auto" | "cnae_completo" | "fluxo_continuo" | "leis_emendas" =
        body?.mode === "cnae_completo" ||
        body?.mode === "fluxo_continuo" ||
        body?.mode === "leis_emendas"
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
      } else if (mode === "leis_emendas") {
        searchPrompt = `Data atual de referência: ${todayIso}.
Busque editais de doação de equipamentos de cozinha industrial/panificação, programas federais (Programa Cozinha Solidária / MDS, PAA), emendas parlamentares, conselhos municipais/estaduais de assistência social (CMAS/CEAS Acre) e fundos de investimento social privado compatíveis EXCLUSIVAMENTE com os CNAEs 94.30-8-00 e 88.00-6-00 para ONG de sopão em Plácido de Castro - AC.${
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
