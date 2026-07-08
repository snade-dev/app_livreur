import type { ApiEnvelope } from './types';
import { clearTokens, getTokens } from './session';

/**
 * Client HTTP typé vers l'API backend (variante STAFF de l'app cliente).
 * Le login staff ne délivre PAS de refresh token : sur 401 la session est
 * simplement purgée (déconnexion propre) et l'app redemande la connexion.
 * L'URL de base vient de l'environnement (`EXPO_PUBLIC_API_BASE_URL`).
 */

const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new ApiError(
      "EXPO_PUBLIC_API_BASE_URL n'est pas définie. Copie .env.example vers .env, " +
        "renseigne l'IP locale du PC, puis relance `pnpm start`.",
    );
  }
  return url.replace(/\/+$/, '');
}

type QueryParams = Record<string, string | number | undefined>;

function buildUrl(path: string, params?: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return `${baseUrl()}${path}${query ? `?${query}` : ''}`;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  params?: QueryParams;
  accessToken?: string;
}

type ReponseServeur<T> = Partial<ApiEnvelope<T>> & { statusCode?: number };

interface RawResult<T> {
  status: number;
  corps: ReponseServeur<T>;
}

async function requeteBrute<T>(
  path: string,
  config: RequestConfig = {},
): Promise<RawResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.body !== undefined) headers['Content-Type'] = 'application/json';
  if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, config.params), {
      method: config.method ?? 'GET',
      headers,
      body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('Le serveur ne répond pas (délai dépassé).');
    }
    throw new ApiError(
      'Connexion au serveur impossible. Vérifie que le téléphone et le PC sont ' +
        "sur le même Wi-Fi et que l'IP dans EXPO_PUBLIC_API_BASE_URL est correcte.",
    );
  } finally {
    clearTimeout(timeout);
  }

  let corps: ReponseServeur<T>;
  try {
    corps = (await response.json()) as ReponseServeur<T>;
  } catch {
    throw new ApiError(`Réponse invalide du serveur (HTTP ${response.status}).`, response.status);
  }

  return { status: response.status, corps };
}

function messageErreur(resultat: RawResult<unknown>): string {
  if (resultat.status === 429) {
    return 'Trop de tentatives. Patiente une minute avant de réessayer.';
  }
  const message = resultat.corps.message;
  if (Array.isArray(message)) return (message as string[]).join(' · ');
  return message || `Erreur serveur (HTTP ${resultat.status}).`;
}

function estSucces(resultat: RawResult<unknown>): boolean {
  return resultat.status >= 200 && resultat.status < 300 && resultat.corps.success === true;
}

function exigerData<T>(resultat: RawResult<T>): T {
  if (!estSucces(resultat) || resultat.corps.data === undefined) {
    throw new ApiError(messageErreur(resultat), resultat.status, resultat.corps.code);
  }
  return resultat.corps.data;
}

// ─── Appels publics (login) ──────────────────────────────────────────────────

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return exigerData(await requeteBrute<T>(path, { method: 'POST', body }));
}

// ─── Appels authentifiés (session staff, sans refresh) ──────────────────────

async function requeteAuth<T>(path: string, config: RequestConfig): Promise<T> {
  const tokens = getTokens();
  if (!tokens) {
    throw new ApiError('Connexion requise.', 401, 'NON_CONNECTE');
  }

  const resultat = await requeteBrute<T>(path, {
    ...config,
    accessToken: tokens.accessToken,
  });

  if (resultat.status === 401) {
    // Token 24 h expiré : déconnexion propre, l'app repasse au login.
    await clearTokens();
    throw new ApiError('Ta session a expiré. Reconnecte-toi.', 401, 'SESSION_EXPIREE');
  }

  return exigerData(resultat);
}

export function getJsonAuth<T>(path: string, params?: QueryParams): Promise<T> {
  return requeteAuth<T>(path, { params });
}

export function postJsonAuth<T>(path: string, body: unknown): Promise<T> {
  return requeteAuth<T>(path, { method: 'POST', body });
}

export function patchJsonAuth<T>(path: string, body: unknown): Promise<T> {
  return requeteAuth<T>(path, { method: 'PATCH', body });
}
