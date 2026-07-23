import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const DOMAIN = { id: 'dom_1', domain: 'mail.acme.com', status: 'pending', dkimSelector: 'tratto1', records: [], createdAt: '', updatedAt: '', verifiedAt: null };

describe('DomainsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('add() POSTs to /v1/domains with { domain }', async () => {
    vi.stubGlobal('fetch', mock({ data: DOMAIN }));
    const result = await tratto.domains.add('mail.acme.com');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/domains`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, string>;
    expect(body['domain']).toBe('mail.acme.com');
    expect((result as { id: string }).id).toBe('dom_1');
  });

  it('list() GETs /v1/domains', async () => {
    vi.stubGlobal('fetch', mock({ data: [DOMAIN], pagination: { hasMore: false, nextCursor: null } }));
    const result = await tratto.domains.list();
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/domains');
    expect(result.data).toHaveLength(1);
  });

  it('list() GETs /v1/domains with query params', async () => {
    vi.stubGlobal('fetch', mock({ data: [DOMAIN], pagination: { hasMore: false, nextCursor: null } }));
    await tratto.domains.list({ after: 'dom_1', limit: 10 });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('after=dom_1');
    expect(url).toContain('limit=10');
  });

  it('get() GETs /v1/domains/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: DOMAIN }));
    await tratto.domains.get('dom_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/domains/dom_1`);
  });

  it('verify() POSTs to /v1/domains/:id/verify', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...DOMAIN, status: 'verified' } }));
    const result = await tratto.domains.verify('dom_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/domains/dom_1/verify`);
    expect(init.method).toBe('POST');
    expect((result as { status: string }).status).toBe('verified');
  });

  it('delete() sends DELETE and returns id + deletedAt', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'dom_1', deletedAt: '2025-01-01T00:00:00Z' } }));
    const result = await tratto.domains.delete('dom_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/domains/dom_1`);
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ id: 'dom_1', deletedAt: '2025-01-01T00:00:00Z' });
  });
});
