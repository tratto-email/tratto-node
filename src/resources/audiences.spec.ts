import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

describe('AudiencesResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('create() POSTs to /v1/audiences', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'aud_1' } }));
    const result = await tratto.audiences.create({ name: 'Newsletter' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/audiences`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ id: 'aud_1' });
  });

  it('list() GETs /v1/audiences with query params', async () => {
    const page = { data: [], pagination: { hasMore: false, nextCursor: null } };
    vi.stubGlobal('fetch', mock(page));
    const result = await tratto.audiences.list({ limit: 5 });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/audiences');
    expect(url).toContain('limit=5');
    expect(result.data).toEqual([]);
  });

  it('get() GETs /v1/audiences/:id', async () => {
    const audience = { id: 'aud_1', name: 'Newsletter', description: '', contactCount: 0, rules: [], createdAt: '2025-01-01T00:00:00Z' };
    vi.stubGlobal('fetch', mock({ data: audience }));
    const result = await tratto.audiences.get('aud_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/audiences/aud_1`);
    expect(result).toEqual(audience);
  });

  it('addContacts() POSTs contactIds to /v1/audiences/:id/contacts', async () => {
    const summary = { added: 2, alreadyInAudience: 0, notFound: 0 };
    vi.stubGlobal('fetch', mock({ data: summary }));
    const result = await tratto.audiences.addContacts('aud_1', ['con_1', 'con_2']);
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/audiences/aud_1/contacts`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ contactIds: ['con_1', 'con_2'] });
    expect(result).toEqual(summary);
  });
});
