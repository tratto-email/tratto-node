import { version } from '../../package.json';
import { TrattoError } from '../error';

interface FetchOptions {
  body?: unknown;
  contentType?: string;
  headers?: Record<string, string>;
}

/** Default per-request timeout, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Tagged template for API paths: every interpolated value is a path segment
 * and is percent-encoded, so an id like `a/b` or `x?y` cannot change the route.
 */
export function path(strings: TemplateStringsArray, ...segments: Array<string | number>): string {
  return strings.reduce(
    (out, str, i) => out + str + (i < segments.length ? encodeURIComponent(String(segments[i])) : ''),
    '',
  );
}

export abstract class BaseResource {
  constructor(
    protected readonly apiKey: string,
    protected readonly baseUrl: string,
    protected readonly timeout: number = DEFAULT_TIMEOUT_MS,
  ) {}

  protected async fetch<T>(method: string, path: string, options?: FetchOptions): Promise<T> {
    const hasBody = options?.body !== undefined;
    const contentType = options?.contentType ?? (hasBody ? 'application/json' : undefined);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': `@tratto/email/${version}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
      ...options?.headers,
    };

    // An explicit contentType means the body is already in its wire form
    // (CSV text, file bytes), even when that type is application/json.
    let body: BodyInit | undefined;
    if (hasBody) {
      body = options?.contentType ? (options.body as BodyInit) : JSON.stringify(options!.body);
    }

    // One signal covers both the response headers and the body read below.
    const signal = AbortSignal.timeout(this.timeout);
    let res: Response;
    let json: Record<string, unknown>;
    try {
      res = await globalThis.fetch(`${this.baseUrl}${path}`, { method, headers, body, signal });

      if (res.status === 204) return undefined as T;

      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch (e) {
        if (isTimeout(e)) throw e;
        // A non-JSON error body (e.g. an HTML 413 from the front end) still becomes a TrattoError.
        if (!res.ok) throw new TrattoError(res.statusText || 'HTTP error', 'unknown_error', res.status);
        throw e;
      }
    } catch (e) {
      if (isTimeout(e)) {
        throw new TrattoError(
          `Request timed out after ${this.timeout} ms: ${method} ${path}`,
          'timeout',
          0,
        );
      }
      throw e;
    }

    if (!res.ok) {
      const err = (json['error'] ?? {}) as {
        message?: string;
        code?: string;
        docs?: string;
        details?: unknown[];
        suggestion?: string;
      };
      throw new TrattoError(
        err.message ?? res.statusText,
        err.code ?? 'unknown_error',
        res.status,
        err.docs,
        err.details,
        err.suggestion,
      );
    }

    return json as T;
  }

  protected async fetchData<T>(method: string, path: string, options?: FetchOptions): Promise<T> {
    const res = await this.fetch<{ data: T }>(method, path, options);
    return res.data;
  }

  protected buildQuery(
    params: Record<string, string | number | boolean | Date | null | undefined>,
  ): string {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val == null) continue;
      qs.set(key, val instanceof Date ? val.toISOString() : String(val));
    }
    const str = qs.toString();
    return str ? `?${str}` : '';
  }
}

function isTimeout(e: unknown): boolean {
  return (e as { name?: unknown } | null)?.name === 'TimeoutError';
}
