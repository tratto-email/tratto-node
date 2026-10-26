import { version } from '../../package.json';
import { TrattoError } from '../error';

interface FetchOptions {
  body?: unknown;
  contentType?: string;
  headers?: Record<string, string>;
}

export abstract class BaseResource {
  constructor(
    protected readonly apiKey: string,
    protected readonly baseUrl: string,
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

    const res = await globalThis.fetch(`${this.baseUrl}${path}`, { method, headers, body });

    if (res.status === 204) return undefined as T;

    let json: Record<string, unknown>;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch (e) {
      // A non-JSON error body (e.g. an HTML 413 from the front end) still becomes a TrattoError.
      if (!res.ok) throw new TrattoError(res.statusText || 'HTTP error', 'unknown_error', res.status);
      throw e;
    }

    if (!res.ok) {
      const err = (json['error'] ?? {}) as {
        message?: string;
        code?: string;
        docs?: string;
        details?: unknown[];
      };
      throw new TrattoError(
        err.message ?? res.statusText,
        err.code ?? 'unknown_error',
        res.status,
        err.docs,
        err.details,
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
