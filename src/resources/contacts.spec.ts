import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

describe('ContactsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('create() POSTs to /v1/contacts', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'con_1' } }));
    const result = await tratto.contacts.create({ email: 'a@b.com' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/contacts`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ id: 'con_1' });
  });

  it('list() GETs /v1/contacts with query params', async () => {
    const page = { data: [], pagination: { hasMore: false, nextCursor: null } };
    vi.stubGlobal('fetch', mock(page));
    const result = await tratto.contacts.list({ status: 'subscribed', limit: 5 });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('/v1/contacts');
    expect(url).toContain('status=subscribed');
    expect(url).toContain('limit=5');
    expect(result.data).toEqual([]);
  });

  it('update() PATCHes /v1/contacts/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'con_1' } }));
    const result = await tratto.contacts.update('con_1', { status: 'unsubscribed' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/contacts/con_1`);
    expect(init.method).toBe('PATCH');
    expect(result).toEqual({ id: 'con_1' });
  });

  it('importCsv() POSTs with Content-Type: text/csv', async () => {
    vi.stubGlobal('fetch', mock({ data: { jobId: 'job_1', totalRows: 3 } }));
    const result = await tratto.contacts.importCsv('email\na@b.com');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/contacts/import`);
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/csv');
    expect(result).toEqual({ jobId: 'job_1', totalRows: 3 });
  });

  it('getImportJob() GETs /v1/contacts/import/:jobId', async () => {
    const jobStatus = { jobId: 'job_1', status: 'completed', totalRows: 3, processedRows: 3, failedRows: 0, errors: [], completedAt: '2025-01-01T00:00:00Z' };
    vi.stubGlobal('fetch', mock({ data: jobStatus }));
    const result = await tratto.contacts.getImportJob('job_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/contacts/import/job_1`);
    expect(result).toEqual(jobStatus);
  });
});
