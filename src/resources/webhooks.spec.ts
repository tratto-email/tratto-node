import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

describe('WebhooksResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('create() POSTs to /v1/webhooks and returns id + secret', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'wh_1', secret: 'sec_abc' } }));
    const result = await tratto.webhooks.create({ url: 'https://app.test/hook', events: ['delivered'] });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/webhooks`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ id: 'wh_1', secret: 'sec_abc' });
  });

  it('list() GETs /v1/webhooks and unwraps array', async () => {
    vi.stubGlobal('fetch', mock({ data: [{ id: 'wh_1' }] }));
    const result = await tratto.webhooks.list();
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/webhooks`);
    expect(init.method).toBe('GET');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('delete() sends DELETE to /v1/webhooks/:id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() }));
    await tratto.webhooks.delete('wh_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/webhooks/wh_1`);
    expect(init.method).toBe('DELETE');
  });

  it('listDeliveries() GETs /v1/webhooks/:id/deliveries', async () => {
    const page = { data: [], pagination: { hasMore: false, nextCursor: null } };
    vi.stubGlobal('fetch', mock(page));
    await tratto.webhooks.listDeliveries('wh_1', { limit: 10 });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain(`/v1/webhooks/wh_1/deliveries`);
    expect(url).toContain('limit=10');
  });

  it('test() POSTs to /v1/webhooks/:id/test', async () => {
    vi.stubGlobal('fetch', mock({ data: { queued: true } }));
    const result = await tratto.webhooks.test('wh_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/webhooks/wh_1/test`);
    expect(result).toEqual({ queued: true });
  });

  it('rotateSecret() POSTs to /v1/webhooks/:id/rotate-secret', async () => {
    vi.stubGlobal('fetch', mock({ data: { secret: 'new_secret' } }));
    const result = await tratto.webhooks.rotateSecret('wh_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/webhooks/wh_1/rotate-secret`);
    expect(result).toEqual({ secret: 'new_secret' });
  });
});
