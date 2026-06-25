import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseResource } from './base';
import { TrattoError } from '../error';

class TestResource extends BaseResource {
  doFetch<T>(method: string, path: string, opts?: { body?: unknown; contentType?: string; headers?: Record<string, string> }) {
    return this.fetch<T>(method, path, opts);
  }
  doFetchData<T>(method: string, path: string, opts?: { body?: unknown; contentType?: string; headers?: Record<string, string> }) {
    return this.fetchData<T>(method, path, opts);
  }
  doBuildQuery(params: Record<string, string | number | boolean | Date | null | undefined>) {
    return this.buildQuery(params);
  }
}

const API_KEY = 'tratto_test_key';
const BASE_URL = 'https://api.tratto.email';

function makeFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  });
}

describe('BaseResource', () => {
  let res: TestResource;

  beforeEach(() => { res = new TestResource(API_KEY, BASE_URL); });
  afterEach(() => vi.unstubAllGlobals());

  describe('fetch()', () => {
    it('builds the correct URL and sets Authorization + User-Agent', async () => {
      const mock = makeFetch({ ok: true });
      vi.stubGlobal('fetch', mock);

      await res.doFetch('GET', '/v1/test');

      const [url, init] = mock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/v1/test`);
      const headers = init.headers as Record<string, string>;
      expect(headers['Authorization']).toBe(`Bearer ${API_KEY}`);
      expect(headers['User-Agent']).toBe('@tratto/email/0.1.0');
    });

    it('serialises body as JSON and sets Content-Type: application/json', async () => {
      const mock = makeFetch({ data: {} });
      vi.stubGlobal('fetch', mock);

      await res.doFetch('POST', '/v1/test', { body: { name: 'test' } });

      const [, init] = mock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect(init.body).toBe(JSON.stringify({ name: 'test' }));
    });

    it('uses a custom contentType and passes body as-is', async () => {
      const mock = makeFetch({ data: {} });
      vi.stubGlobal('fetch', mock);

      await res.doFetch('POST', '/v1/test', { body: 'csv,data', contentType: 'text/csv' });

      const [, init] = mock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/csv');
      expect(init.body).toBe('csv,data');
    });

    it('merges extra headers', async () => {
      const mock = makeFetch({});
      vi.stubGlobal('fetch', mock);

      await res.doFetch('GET', '/v1/test', { headers: { 'Idempotency-Key': 'abc123' } });

      const [, init] = mock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('abc123');
    });

    it('returns undefined for HTTP 204 without calling json()', async () => {
      const jsonFn = vi.fn();
      const mock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: jsonFn });
      vi.stubGlobal('fetch', mock);

      const result = await res.doFetch('DELETE', '/v1/test');
      expect(result).toBeUndefined();
      expect(jsonFn).not.toHaveBeenCalled();
    });

    it('throws TrattoError with API error payload on non-ok response', async () => {
      vi.stubGlobal('fetch', makeFetch(
        { error: { message: 'Not found', code: 'not_found', docs: 'https://docs.example.com' } },
        404,
      ));

      await expect(res.doFetch('GET', '/v1/test')).rejects.toMatchObject({
        message: 'Not found',
        code: 'not_found',
        statusCode: 404,
        docs: 'https://docs.example.com',
      });
    });

    it('throws TrattoError with statusText fallback when error body is absent', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false, status: 500, statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      }));

      await expect(res.doFetch('GET', '/v1/test')).rejects.toMatchObject({
        message: 'Internal Server Error',
        code: 'unknown_error',
        statusCode: 500,
      });
    });

    it('thrown error is instanceof TrattoError', async () => {
      vi.stubGlobal('fetch', makeFetch({ error: { message: 'err', code: 'err' } }, 400));

      await expect(res.doFetch('GET', '/v1/test')).rejects.toBeInstanceOf(TrattoError);
    });
  });

  describe('fetchData()', () => {
    it('unwraps the data property from the response envelope', async () => {
      vi.stubGlobal('fetch', makeFetch({ data: { id: 'obj_1', value: 42 } }));

      const result = await res.doFetchData<{ id: string; value: number }>('GET', '/v1/test');
      expect(result).toEqual({ id: 'obj_1', value: 42 });
    });
  });

  describe('buildQuery()', () => {
    it('returns empty string when all values are null or undefined', () => {
      expect(res.doBuildQuery({ a: null, b: undefined })).toBe('');
    });

    it('builds a ?-prefixed query string from non-null values', () => {
      const qs = res.doBuildQuery({ limit: 10, status: 'active' });
      expect(qs).toMatch(/^\?/);
      expect(qs).toContain('limit=10');
      expect(qs).toContain('status=active');
    });

    it('skips null and undefined but includes false and 0', () => {
      const qs = res.doBuildQuery({ a: null, b: undefined, c: false, d: 0 });
      expect(qs).not.toContain('a=');
      expect(qs).not.toContain('b=');
      expect(qs).toContain('c=false');
      expect(qs).toContain('d=0');
    });

    it('serialises Date to ISO string', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const qs = res.doBuildQuery({ dateFrom: date });
      expect(decodeURIComponent(qs)).toContain('dateFrom=2025-01-01T00:00:00.000Z');
    });
  });
});
