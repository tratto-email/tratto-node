import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

describe('ApiKeysResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('create() POSTs to /v1/api-keys and returns ApiKeyCreated', async () => {
    const created = { id: 'key_1', name: 'CI', prefix: 'tratto_live_abc...', env: 'live', permissions: ['emails:send'], key: 'tratto_live_full_key', createdAt: '', lastUsedAt: null, revokedAt: null };
    vi.stubGlobal('fetch', mock({ data: created }));
    const result = await tratto.apiKeys.create({ name: 'CI', env: 'live', permissions: ['emails:send'] });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/api-keys`);
    expect(init.method).toBe('POST');
    expect((result as { key: string }).key).toBe('tratto_live_full_key');
  });

  it('create() includes Idempotency-Key header when provided', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'key_1', key: 'k' } }));
    await tratto.apiKeys.create({ name: 'CI', env: 'live', permissions: [] }, 'idem-key');
    const [, init] = fetchCalls()[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('idem-key');
  });

  it('list() GETs /v1/api-keys', async () => {
    vi.stubGlobal('fetch', mock({ data: [], pagination: { hasMore: false, nextCursor: null } }));
    const result = await tratto.apiKeys.list();
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/api-keys');
    expect(result.data).toEqual([]);
  });

  it('list() GETs /v1/api-keys with query params', async () => {
    vi.stubGlobal('fetch', mock({ data: [], pagination: { hasMore: false, nextCursor: null } }));
    await tratto.apiKeys.list({ after: 'key_1', limit: 10 });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('after=key_1');
    expect(url).toContain('limit=10');
  });

  it('revoke() DELETEs /v1/api-keys/:id and returns id + revokedAt', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'key_1', revokedAt: '2025-01-01T00:00:00Z' } }));
    const result = await tratto.apiKeys.revoke('key_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/api-keys/key_1`);
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ id: 'key_1', revokedAt: '2025-01-01T00:00:00Z' });
  });
});
