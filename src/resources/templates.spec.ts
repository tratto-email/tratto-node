import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const TPL = { id: 'tpl_1', name: 'Test', status: 'draft', version: 1, html: '<p>Hi</p>', createdAt: '', updatedAt: '' };

describe('TemplatesResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('list() GETs /v1/templates', async () => {
    vi.stubGlobal('fetch', mock({ data: [TPL], pagination: { hasMore: false, nextCursor: null } }));
    const result = await tratto.templates.list({ status: 'draft' });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/templates');
    expect(url).toContain('status=draft');
    expect(result.data).toHaveLength(1);
  });

  it('create() POSTs to /v1/templates and returns Template', async () => {
    vi.stubGlobal('fetch', mock({ data: TPL }));
    const result = await tratto.templates.create({ name: 'Test', html: '<p>Hi</p>' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/templates`);
    expect(init.method).toBe('POST');
    expect((result as { id: string }).id).toBe('tpl_1');
  });

  it('get() GETs /v1/templates/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: TPL }));
    await tratto.templates.get('tpl_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1`);
  });

  it('update() PATCHes /v1/templates/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...TPL, version: 2 } }));
    const result = await tratto.templates.update('tpl_1', { html: '<p>Updated</p>' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1`);
    expect(init.method).toBe('PATCH');
    expect((result as { version: number }).version).toBe(2);
  });

  it('delete() sends DELETE to /v1/templates/:id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() }));
    await tratto.templates.delete('tpl_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1`);
    expect(init.method).toBe('DELETE');
  });

  it('listVersions() GETs /v1/templates/:id/versions', async () => {
    vi.stubGlobal('fetch', mock({ data: [{ version: 1, savedAt: '' }] }));
    const result = await tratto.templates.listVersions('tpl_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1/versions`);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getVersion() GETs /v1/templates/:id/versions/:version', async () => {
    vi.stubGlobal('fetch', mock({ data: { version: 2, savedAt: '', html: '<p>v2</p>' } }));
    await tratto.templates.getVersion('tpl_1', 2);
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1/versions/2`);
  });

  it('testSend() POSTs to /v1/templates/:id/test-send with variables', async () => {
    vi.stubGlobal('fetch', mock({ data: { queued: true } }));
    const result = await tratto.templates.testSend('tpl_1', 'me@example.com', { name: 'Alice' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/templates/tpl_1/test-send`);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['to']).toBe('me@example.com');
    expect((body['variables'] as Record<string, string>)['name']).toBe('Alice');
    expect(result).toEqual({ queued: true });
  });
});
