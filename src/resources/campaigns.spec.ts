import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const CAMPAIGN = { id: 'cmp_1', name: 'Test', status: 'draft', templateId: 'tpl_1', audienceId: 'aud_1', fromName: 'Acme', fromEmail: 'a@b.com', subjectA: 'Hello', subjectB: null, scheduledAt: null, sentAt: null, stats: {}, createdAt: '' };

describe('CampaignsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('create() POSTs to /v1/campaigns', async () => {
    vi.stubGlobal('fetch', mock({ data: { id: 'cmp_1' } }));
    const result = await tratto.campaigns.create({ name: 'Test', templateId: 'tpl_1', audienceId: 'aud_1', fromName: 'Acme', fromEmail: 'a@b.com', subjectA: 'Hi' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/campaigns`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ id: 'cmp_1' });
  });

  it('list() GETs /v1/campaigns with status filter', async () => {
    const page = { data: [CAMPAIGN], pagination: { hasMore: false, nextCursor: null } };
    vi.stubGlobal('fetch', mock(page));
    const result = await tratto.campaigns.list({ status: 'draft' });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toContain('status=draft');
    expect(result.data).toHaveLength(1);
  });

  it('get() GETs /v1/campaigns/:id', async () => {
    vi.stubGlobal('fetch', mock({ data: CAMPAIGN }));
    const result = await tratto.campaigns.get('cmp_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/campaigns/cmp_1`);
    expect((result as { id: string }).id).toBe('cmp_1');
  });

  it('getStats() GETs /v1/campaigns/:id/stats', async () => {
    vi.stubGlobal('fetch', mock({ data: { campaignId: 'cmp_1', status: 'completed', stats: {}, rates: {} } }));
    await tratto.campaigns.getStats('cmp_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/campaigns/cmp_1/stats`);
  });

  it('send() POSTs to /v1/campaigns/:id/send', async () => {
    vi.stubGlobal('fetch', mock({ data: { status: 'sending' } }));
    const result = await tratto.campaigns.send('cmp_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/campaigns/cmp_1/send`);
    expect(init.method).toBe('POST');
    expect(result).toEqual({ status: 'sending' });
  });

  it('send() serialises scheduledAt Date to ISO string in body', async () => {
    vi.stubGlobal('fetch', mock({ data: { status: 'scheduled' } }));
    const date = new Date('2025-07-01T09:00:00.000Z');
    await tratto.campaigns.send('cmp_1', { scheduledAt: date });
    const [, init] = fetchCalls()[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['scheduledAt']).toBe('2025-07-01T09:00:00.000Z');
  });

  it('pause() POSTs to /v1/campaigns/:id/pause', async () => {
    vi.stubGlobal('fetch', mock({ data: { status: 'paused' } }));
    await tratto.campaigns.pause('cmp_1');
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/campaigns/cmp_1/pause`);
  });

  it('testSend() POSTs to /v1/campaigns/:id/test-send', async () => {
    vi.stubGlobal('fetch', mock({ data: { emailId: 'em_1' } }));
    const result = await tratto.campaigns.testSend('cmp_1', 'me@example.com');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/campaigns/cmp_1/test-send`);
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['to']).toBe('me@example.com');
    expect(result).toEqual({ emailId: 'em_1' });
  });
});
