import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const FLOW = { id: 'flw_1', name: 'Welcome', status: 'draft', trigger: { type: 'manual', config: {} }, steps: [], enrollments: 0, createdAt: '', updatedAt: '' };

describe('FlowsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('list() GETs /v1/flows', async () => {
    vi.stubGlobal('fetch', mock({ data: [FLOW], pagination: { hasMore: false, nextCursor: null } }));
    const result = await tratto.flows.list();
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/flows');
    expect(result.data).toHaveLength(1);
  });

  it('create() POSTs to /v1/flows', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'flw_1' } }));
    const result = await tratto.flows.create({ name: 'Welcome' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/flows`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ id: 'flw_1' });
  });

  it('get() GETs /v1/flows/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: FLOW }));
    await tratto.flows.get('flw_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/flows/flw_1`);
  });

  it('update() PATCHes /v1/flows/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: FLOW }));
    await tratto.flows.update('flw_1', { name: 'Updated' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/flows/flw_1`);
    expect(init.method).toBe('PATCH');
  });

  it('delete() DELETEs /v1/flows/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'flw_1' } }));
    const result = await tratto.flows.delete('flw_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/flows/flw_1`);
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ id: 'flw_1' });
  });

  it('activate() POSTs to /v1/flows/:id/activate', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...FLOW, status: 'active' } }));
    const result = await tratto.flows.activate('flw_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/flows/flw_1/activate`);
    expect((result as { status: string }).status).toBe('active');
  });

  it('deactivate() POSTs to /v1/flows/:id/deactivate', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...FLOW, status: 'inactive' } }));
    const result = await tratto.flows.deactivate('flw_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/flows/flw_1/deactivate`);
    expect((result as { status: string }).status).toBe('inactive');
  });
});
