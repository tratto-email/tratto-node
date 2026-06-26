import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const WS = { id: 'ws_1', name: 'Acme', slug: 'acme', timezone: 'UTC', locale: 'en', plan: 'starter', createdAt: '' };
const MEMBER = { userId: 'usr_1', email: 'dev@acme.com', displayName: null, role: 'admin', joinedAt: '' };

describe('WorkspaceResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('get() GETs /v1/workspace', async () => {
    vi.stubGlobal('fetch', mock({ data: WS }));
    const result = await tratto.workspace.get();
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace`);
    expect(init.method).toBe('GET');
    expect((result as { name: string }).name).toBe('Acme');
  });

  it('update() PATCHes /v1/workspace', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...WS, name: 'Acme Corp' } }));
    await tratto.workspace.update({ name: 'Acme Corp' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace`);
    expect(init.method).toBe('PATCH');
  });

  it('delete() sends DELETE /v1/workspace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() }));
    await tratto.workspace.delete();
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace`);
    expect(init.method).toBe('DELETE');
  });

  it('updatePreferences() PATCHes /v1/workspace/preferences', async () => {
    const prefs = { locale: 'en', emailNotifications: { bounces: true, weeklyReport: false, billingAlerts: true } };
    vi.stubGlobal('fetch', mock({ data: prefs }));
    const result = await tratto.workspace.updatePreferences({ locale: 'en' });
    const [url] = fetchCalls()[0] as [string];
    expect(url).toBe(`${BASE}/v1/workspace/preferences`);
    expect(result).toEqual(prefs);
  });

  it('inviteMember() POSTs to /v1/workspace/members/invite', async () => {
    vi.stubGlobal('fetch', mock({ data: MEMBER }));
    const result = await tratto.workspace.inviteMember({ email: 'dev@acme.com', role: 'admin' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace/members/invite`);
    expect(init.method).toBe('POST');
    expect((result as { role: string }).role).toBe('admin');
  });

  it('updateMember() PATCHes /v1/workspace/members/:userId', async () => {
    vi.stubGlobal('fetch', mock({ data: { ...MEMBER, role: 'member' } }));
    await tratto.workspace.updateMember('usr_1', { role: 'member' });
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace/members/usr_1`);
    expect(init.method).toBe('PATCH');
  });

  it('removeMember() DELETEs /v1/workspace/members/:userId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() }));
    await tratto.workspace.removeMember('usr_1');
    const [url, init] = fetchCalls()[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/v1/workspace/members/usr_1`);
    expect(init.method).toBe('DELETE');
  });
});
