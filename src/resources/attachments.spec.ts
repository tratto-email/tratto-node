import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto, TrattoError } from '../client';
import { contentDisposition } from './attachments';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];

const ATT = {
  id: 'att_123456789012345678901', filename: 'invoice.pdf', contentType: 'application/pdf',
  size: 3, sha256: 'ab', livemode: false, expiresAt: '2030-01-01T00:00:00.000Z',
};

describe('AttachmentsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  it('upload() POSTs the raw bytes with Content-Type and Content-Disposition', async () => {
    vi.stubGlobal('fetch', mock({ data: ATT }, 201));
    const bytes = Buffer.from('%PD');
    const result = await tratto.attachments.upload(bytes, { filename: 'invoice.pdf', contentType: 'application/pdf' });

    const [url, init] = fetchCalls()[0]!;
    expect(url).toBe(`${BASE}/v1/attachments`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(bytes);
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/pdf');
    expect(headers['Content-Disposition']).toBe('attachment; filename="invoice.pdf"');
    expect(result).toEqual(ATT);
  });

  it('upload() does not JSON-serialise a .json file', async () => {
    vi.stubGlobal('fetch', mock({ data: ATT }, 201));
    const bytes = new TextEncoder().encode('{"a":1}');
    await tratto.attachments.upload(bytes, { filename: 'data.json', contentType: 'application/json' });
    expect(fetchCalls()[0]![1].body).toBe(bytes);
  });

  it('upload() surfaces QUOTA_EXCEEDED as a TrattoError', async () => {
    vi.stubGlobal('fetch', mock({ error: { code: 'QUOTA_EXCEEDED', message: 'storage full' } }, 429));
    const err = await tratto.attachments.upload(new Uint8Array([1]), { filename: 'a.bin', contentType: 'application/octet-stream' }).catch(e => e);
    expect(err).toBeInstanceOf(TrattoError);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('QUOTA_EXCEEDED');
  });

  it('get() GETs /v1/attachments/:id and unwraps data', async () => {
    vi.stubGlobal('fetch', mock({ data: ATT }));
    const result = await tratto.attachments.get(ATT.id);
    expect(fetchCalls()[0]![0]).toBe(`${BASE}/v1/attachments/${ATT.id}`);
    expect(result.sha256).toBe('ab');
  });

  it('delete() DELETEs /v1/attachments/:id and resolves on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    await expect(tratto.attachments.delete(ATT.id)).resolves.toBeUndefined();
    const [url, init] = fetchCalls()[0]!;
    expect(url).toBe(`${BASE}/v1/attachments/${ATT.id}`);
    expect(init.method).toBe('DELETE');
  });
});

describe('contentDisposition()', () => {
  it('quotes ASCII names and escapes quotes and backslashes', () => {
    expect(contentDisposition('a "b"\\c.pdf')).toBe('attachment; filename="a \\"b\\"\\\\c.pdf"');
  });

  it('adds filename* with RFC 5987 encoding for non-ASCII names', () => {
    expect(contentDisposition("fattura n°1 (l'ultima).pdf")).toBe(
      'attachment; filename="fattura n_1 (l\'ultima).pdf"; filename*=UTF-8\'\'fattura%20n%C2%B01%20%28l%27ultima%29.pdf',
    );
  });

  it('percent-encodes control characters instead of putting them in the header', () => {
    expect(contentDisposition('a\r\nb.pdf')).toBe('attachment; filename="a__b.pdf"; filename*=UTF-8\'\'a%0D%0Ab.pdf');
  });
});
