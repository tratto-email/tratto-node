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
      'User-Agent': '@tratto/email/0.1.0',
      ...(contentType ? { 'Content-Type': contentType } : {}),
      ...options?.headers,
    };

    let body: string | undefined;
    if (hasBody) {
      body =
        contentType === 'application/json'
          ? JSON.stringify(options!.body)
          : (options!.body as string);
    }

    const res = await globalThis.fetch(`${this.baseUrl}${path}`, { method, headers, body });

    if (res.status === 204) return undefined as T;

    const json = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      const err = (json['error'] ?? {}) as {
        message?: string;
        code?: string;
        docs?: string;
      };
      throw new TrattoError(
        err.message ?? res.statusText,
        err.code ?? 'unknown_error',
        res.status,
        err.docs,
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
