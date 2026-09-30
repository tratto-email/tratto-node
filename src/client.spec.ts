import { describe, it, expect, vi, afterEach } from 'vitest';
import { Tratto, TrattoError } from './client';

const API_KEY = 'tratto_test_key';


describe('workspace senders (tipi, #28)', () => {
  it('manda una scrittura parziale, e il null che rimette in eredita', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { id: 'ws_1' } }),
      text: async () => '{"data":{"id":"ws_1"}}',
    });
    vi.stubGlobal('fetch', fetchMock);

    const tratto = new Tratto(API_KEY);

    // Un tipo solo: gli altri due non si toccano.
    await tratto.workspace.update({
      senders: { marketing: { fromEmail: 'news@acme.test', fromName: 'Acme' } },
    });
    // null: quel tipo torna a ereditare il mittente generale del workspace.
    await tratto.workspace.update({ senders: { marketing: null } });

    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)));
    expect(bodies[0]).toEqual({
      senders: { marketing: { fromEmail: 'news@acme.test', fromName: 'Acme' } },
    });
    expect(bodies[1]).toEqual({ senders: { marketing: null } });

    vi.unstubAllGlobals();
  });
});

describe('Tratto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('throws when apiKey is an empty string', () => {
    expect(() => new Tratto('')).toThrow('apiKey is required');
  });

  it('instantiates all 11 resource namespaces', () => {
    const tratto = new Tratto(API_KEY);
    expect(tratto.emails).toBeDefined();
    expect(tratto.contacts).toBeDefined();
    expect(tratto.audiences).toBeDefined();
    expect(tratto.campaigns).toBeDefined();
    expect(tratto.templates).toBeDefined();
    expect(tratto.webhooks).toBeDefined();
    expect(tratto.domains).toBeDefined();
    expect(tratto.analytics).toBeDefined();
    expect(tratto.flows).toBeDefined();
    expect(tratto.workspace).toBeDefined();
    // API key management is deliberately not part of the SDK: keys are issued
    // and scoped from the dashboard, never from application code.
    expect((tratto as unknown as Record<string, unknown>)['apiKeys']).toBeUndefined();
  });

  it('uses a custom baseUrl', async () => {
    const tratto = new Tratto(API_KEY, { baseUrl: 'https://custom.api.test' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ data: { id: 'em_1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toMatch(/^https:\/\/custom\.api\.test/);
  });

  it('strips trailing slash from baseUrl', async () => {
    const tratto = new Tratto(API_KEY, { baseUrl: 'https://custom.api.test/' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ data: { id: 'em_1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('//v1');
  });
});

describe('TrattoError', () => {
  it('is an instance of Error', () => {
    const err = new TrattoError('Not found', 'not_found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(TrattoError);
  });

  it('exposes code, statusCode, and docs', () => {
    const err = new TrattoError('Bad request', 'invalid_params', 400, 'https://docs.tratto.email');
    expect(err.name).toBe('TrattoError');
    expect(err.message).toBe('Bad request');
    expect(err.code).toBe('invalid_params');
    expect(err.statusCode).toBe(400);
    expect(err.docs).toBe('https://docs.tratto.email');
  });

  it('docs is undefined when not provided', () => {
    const err = new TrattoError('err', 'err', 500);
    expect(err.docs).toBeUndefined();
  });
});
