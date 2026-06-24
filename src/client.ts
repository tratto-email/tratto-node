import type {
  SendEmailOptions,
  SendEmailResponse,
  ListEmailsOptions,
  Email,
  ApiError,
} from './types';

const DEFAULT_BASE_URL = 'https://api.tratto.email';

export class TrattoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'TrattoError';
  }
}

export class Tratto {
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(apiKey: string, options?: { baseUrl?: string }) {
    if (!apiKey) throw new Error('apiKey is required');
    this.#apiKey = apiKey;
    this.#baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  }

  async #request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@tratto/email/0.1.0',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json() as { data?: T; error?: ApiError };

    if (!res.ok) {
      throw new TrattoError(
        data.error?.message ?? res.statusText,
        data.error?.code ?? 'unknown_error',
        res.status,
      );
    }

    return data.data as T;
  }

  readonly emails = {
    send: (options: SendEmailOptions): Promise<SendEmailResponse> =>
      this.#request('POST', '/v1/emails', options),

    list: (options?: ListEmailsOptions): Promise<{ data: Email[]; pagination: { hasMore: boolean; nextCursor?: string } }> => {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.after) params.set('after', options.after);
      const qs = params.toString();
      return this.#request('GET', `/v1/emails${qs ? `?${qs}` : ''}`);
    },

    get: (id: string): Promise<Email> =>
      this.#request('GET', `/v1/emails/${id}`),
  };
}
