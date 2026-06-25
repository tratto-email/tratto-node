import { describe, it, expect, vi, afterEach } from 'vitest';
import { Tratto, TrattoError } from './client';

const API_KEY = 'tratto_test_key';

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
    expect(tratto.apiKeys).toBeDefined();
    expect(tratto.analytics).toBeDefined();
    expect(tratto.flows).toBeDefined();
    expect(tratto.workspace).toBeDefined();
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
