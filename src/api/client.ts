/**
 * Minimal fetch-based HTTP client for the Slotly backend.
 *
 * Auth: the backend's only gate is `TelegramAuthFilter`, which expects
 * `Authorization: tma <initData>` (Telegram-signed initData, re-validated on
 * every request). Supply it via `setCredentialProvider`. A 401 means the
 * credential is missing/expired; 403 means banned or wrong mode.
 */
import { getApiBaseUrl, REQUEST_TIMEOUT_MS } from './config';

type CredentialProvider = () => string | null | Promise<string | null>;
type UnauthorizedHandler = (error: ApiError) => void;

let credentialProvider: CredentialProvider = () => null;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registers the source of the `tma` credential (raw initData string). */
export function setCredentialProvider(provider: CredentialProvider): void {
  credentialProvider = provider;
}

/** Called on every 401 (e.g. to clear the session and route to login). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly url: string,
    /** Parsed JSON body if the server sent one, otherwise raw text or null. */
    readonly body: unknown,
  ) {
    super(ApiError.describe(status, method, url, body));
    this.name = 'ApiError';
  }

  private static describe(status: number, method: string, url: string, body: unknown): string {
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      const msg = b.message ?? b.error ?? b.detail;
      if (typeof msg === 'string') return msg;
    }
    return `${method} ${url} failed with ${status}`;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

/** Thrown for network failures / timeouts (no HTTP response). */
export class NetworkError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip the `Authorization` header (public endpoints). */
  skipAuth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Resolves backend-relative URLs (e.g. `/api/user/123/photo`) to absolute ones. */
export function resolveApiUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? getApiBaseUrl() + url : url;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const url = getApiBaseUrl() + path + buildQuery(options.query);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.skipAuth && !headers.Authorization) {
    const credential = await credentialProvider();
    if (credential) headers.Authorization = `tma ${credential}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = controller.signal.aborted && !options.signal?.aborted;
    throw new NetworkError(aborted ? `${method} ${path} timed out` : `${method} ${path} network error`, e);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  const body = await parseBody(response);
  if (!response.ok) {
    const error = new ApiError(response.status, method, url, body);
    if (error.isUnauthorized) onUnauthorized?.(error);
    throw error;
  }
  return body as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
