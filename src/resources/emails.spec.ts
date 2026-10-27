import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto, TrattoError } from '../client';
import type { BatchEmailParams } from '../types';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';

const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300, status, statusText: 'OK',
    json: () => Promise.resolve(data),
  });

describe('path encoding and timeout', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('percent-encodes ids so they cannot change the route', async () => {
    vi.stubGlobal('fetch', mock({ data: {} }));
    const tratto = new Tratto(API_KEY);
    await tratto.emails.get('a/b');
    await tratto.webhooks.listDeliveries('../x?y#z', { limit: 5 });
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls as [string][];
    expect(calls[0]![0]).toBe(`${BASE}/v1/emails/a%2Fb`);
    expect(calls[1]![0]).toBe(`${BASE}/v1/webhooks/..%2Fx%3Fy%23z/deliveries?limit=5`);
  });

  it('aborts a stalled request after the timeout option with a TrattoError', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal!.reason));
      }),
    ));
    const tratto = new Tratto(API_KEY, { timeout: 20 });
    const err = await tratto.emails.get('em_1').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TrattoError);
    expect(err).toMatchObject({ code: 'timeout', statusCode: 0 });
    expect((err as TrattoError).message).toBe('Request timed out after 20 ms: GET /v1/emails/em_1');
  });

  it('passes a signal on every request by default', async () => {
    vi.stubGlobal('fetch', mock({ data: {} }));
    await new Tratto(API_KEY).emails.get('em_1');
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects a non-positive timeout', () => {
    expect(() => new Tratto(API_KEY, { timeout: 0 })).toThrow(/timeout/);
  });
});

describe('EmailsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  describe('send()', () => {
    it('POSTs to /v1/emails and unwraps { id }', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));

      const result = await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });

      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/v1/emails`);
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${API_KEY}`);
      expect(result).toEqual({ id: 'em_1' });
    });

    it('sends markdown verbatim in the body (mutually exclusive with html, enforced server-side)', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'email_1', livemode: true } }));
      await tratto.emails.send({ from: 'a@b.c', to: 'success@simulator.amazonses.com', subject: 'md', markdown: '# Hi {{name}}' });
      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body));
      expect(body.markdown).toBe('# Hi {{name}}');
      expect(body).not.toHaveProperty('html');
    });

    it('sends no from key at all when from is omitted (the API then resolves the workspace sender)', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      // Compiles without `from`: the typecheck job fails if it becomes required again.
      await tratto.emails.send({ to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });
      await tratto.emails.send({ from: undefined, to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });

      for (const [, init] of (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][]) {
        const body = JSON.parse(String(init.body));
        expect(body).not.toHaveProperty('from');
        expect(body).toEqual({ to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });
      }
    });

    it('sends from verbatim when passed', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ from: 'Acme <a@b.com>', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });
      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(String(init.body)).from).toBe('Acme <a@b.com>');
    });

    it('includes Idempotency-Key header when provided', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' }, 'key-123');

      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('key-123');
    });

    it('sends attachments by id', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>', attachments: [{ id: 'att_1' }] });
      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(String(init.body)).attachments).toEqual([{ id: 'att_1' }]);
    });

    it('surfaces PLAN_UPGRADE_REQUIRED as a TrattoError', async () => {
      vi.stubGlobal('fetch', mock({ error: { code: 'PLAN_UPGRADE_REQUIRED', message: 'Starter plan' } }, 403));
      const err = await tratto.emails.send({ to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>', attachments: [{ id: 'att_1' }] }).catch(e => e);
      expect(err).toBeInstanceOf(TrattoError);
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('PLAN_UPGRADE_REQUIRED');
    });

    it('omits Idempotency-Key when not provided', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });

      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBeUndefined();
    });
  });

  describe('sendBatch()', () => {
    const calls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
    const emails: BatchEmailParams[] = [
      { to: 'a@x.it', subject: 'A', html: '<p>A</p>' },
      { to: 'b@x.it', subject: 'B', html: '<p>B</p>' },
    ];
    const queued = { batchId: 'batch_1', livemode: true, accepted: 2, failed: 0, emails: [
      { id: 'email_1', status: 'queued', to: ['a@x.it'] },
      { id: 'email_2', status: 'queued', to: ['b@x.it'] },
    ] };

    it('POSTs { emails } to /v1/emails/batch with the Idempotency-Key header', async () => {
      vi.stubGlobal('fetch', mock({ data: queued }, 202));
      const result = await tratto.emails.sendBatch(emails, 'key-1');

      const [url, init] = calls()[0]!;
      expect(url).toBe(`${BASE}/v1/emails/batch`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual({ emails });
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('key-1');
      expect(result).toEqual(queued);
    });

    it('omits Idempotency-Key when not provided', async () => {
      vi.stubGlobal('fetch', mock({ data: queued }, 202));
      await tratto.emails.sendBatch(emails);
      expect((calls()[0]![1].headers as Record<string, string>)['Idempotency-Key']).toBeUndefined();
    });

    it('resolves a 202 with failed > 0, in request order, with one fetch and no retry', async () => {
      const partial = { batchId: 'batch_2', livemode: true, accepted: 1, failed: 1, emails: [
        { id: 'email_1', status: 'queued', to: ['a@x.it'] },
        { status: 'failed', to: ['b@x.it'], error: { code: 'SERVICE_UNAVAILABLE', message: 'try again' } },
      ] };
      vi.stubGlobal('fetch', mock({ data: partial }, 202));
      const result = await tratto.emails.sendBatch(emails, 'key-2');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      // Type-level: typecheck fails if `failed` ever becomes optional.
      const failedCount: number = result.failed;
      expect(failedCount).toBe(1);
      expect(result.emails.map(e => e.to[0])).toEqual(['a@x.it', 'b@x.it']);
      const second = result.emails[1]!;
      expect(second.status).toBe('failed');
      if (second.status === 'failed') expect(second.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(second).not.toHaveProperty('id');
    });

    it('throws TrattoError on 503 after a single call', async () => {
      vi.stubGlobal('fetch', mock({ error: { code: 'SERVICE_UNAVAILABLE', message: 'busy' } }, 503));
      const err = await tratto.emails.sendBatch(emails, 'key-3').catch(e => e);
      expect(err).toBeInstanceOf(TrattoError);
      expect(err.statusCode).toBe(503);
      expect(err.code).toBe('SERVICE_UNAVAILABLE');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps error.details on a 422, so the caller knows which email is wrong', async () => {
      vi.stubGlobal('fetch', mock({ error: {
        code: 'VALIDATION_ERROR', message: 'invalid',
        details: [{ path: '/emails/1/to', message: 'must be an email' }],
      } }, 422));
      const err = (await tratto.emails.sendBatch(emails).catch(e => e)) as TrattoError;
      expect(err.statusCode).toBe(422);
      expect((err.details?.[0] as { path: string }).path).toBe('/emails/1/to');
    });

    it('rejects scheduledAt at compile time', () => {
      const withSchedule = { to: 'a@x.it', subject: 'A', html: '<p>A</p>', scheduledAt: '2030-01-01T00:00:00Z' };
      // @ts-expect-error scheduledAt is not accepted in a batch
      const a: BatchEmailParams = withSchedule;
      expect(a).toBeDefined();
    });

    it('sends attachments by id on each email', async () => {
      vi.stubGlobal('fetch', mock({ data: queued }, 202));
      const withFiles: BatchEmailParams[] = [{ to: 'a@x.it', subject: 'A', html: '<p>A</p>', attachments: [{ id: 'att_1' }] }];
      await tratto.emails.sendBatch(withFiles);
      expect(JSON.parse(String(calls()[0]![1].body)).emails[0].attachments).toEqual([{ id: 'att_1' }]);
    });
  });

  describe('list()', () => {
    const emptyPage = { data: [], pagination: { hasMore: false, nextCursor: null } };

    it('GETs /v1/emails and returns PaginatedResponse directly', async () => {
      vi.stubGlobal('fetch', mock(emptyPage));
      const result = await tratto.emails.list();

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      expect(url).toBe(`${BASE}/v1/emails`);
      expect(result.data).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('appends query params for status and limit', async () => {
      vi.stubGlobal('fetch', mock(emptyPage));
      await tratto.emails.list({ limit: 10, status: 'delivered' });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      expect(url).toContain('limit=10');
      expect(url).toContain('status=delivered');
    });

    it('serialises Date values for dateFrom and dateTo', async () => {
      vi.stubGlobal('fetch', mock(emptyPage));
      const date = new Date('2025-01-01T00:00:00.000Z');
      await tratto.emails.list({ dateFrom: date, dateTo: date });

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      expect(decodeURIComponent(url)).toContain('dateFrom=2025-01-01T00:00:00.000Z');
    });

    it('returns items and pagination when present', async () => {
      vi.stubGlobal('fetch', mock({
        data: [{ id: 'em_1' }],
        pagination: { hasMore: true, nextCursor: 'cursor_1' },
      }));
      const result = await tratto.emails.list();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.nextCursor).toBe('cursor_1');
    });
  });

  describe('get()', () => {
    it('GETs /v1/emails/:id and unwraps data', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1', events: [] } }));
      const result = await tratto.emails.get('em_1');

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      expect(url).toBe(`${BASE}/v1/emails/em_1`);
      expect((result as { id: string }).id).toBe('em_1');
    });

    it('returns attachments and failureReason', async () => {
      const attachments = [{ id: 'att_1', filename: 'a.pdf', contentType: 'application/pdf', size: 3 }];
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1', status: 'failed', failureReason: 'attachment_unavailable', attachments, events: [] } }));
      const result = await tratto.emails.get('em_1');
      expect(result.attachments).toEqual(attachments);
      expect(result.failureReason).toBe('attachment_unavailable');
    });
  });

  describe('listEvents()', () => {
    it('GETs /v1/emails/:id/events and unwraps data array', async () => {
      const events = [{ type: 'delivered', occurredAt: '2025-01-01T00:00:00Z' }];
      vi.stubGlobal('fetch', mock({ data: events }));
      const result = await tratto.emails.listEvents('em_1');

      const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      expect(url).toBe(`${BASE}/v1/emails/em_1/events`);
      expect(result).toEqual(events);
    });
  });
  describe('cancel()', () => {
    it('DELETEs /v1/emails/:id and resolves on 204', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));
      await expect(tratto.emails.cancel('em_1')).resolves.toBeUndefined();

      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/v1/emails/em_1`);
      expect(init.method).toBe('DELETE');
      expect(init.body).toBeUndefined();
    });

    it('throws a TrattoError on 409 when the email is no longer scheduled', async () => {
      vi.stubGlobal('fetch', mock({ error: { code: 'CONFLICT', message: "Only scheduled emails can be canceled, this one is 'sent'." } }, 409));
      const err = await tratto.emails.cancel('em_1').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(TrattoError);
      expect(err).toMatchObject({ code: 'CONFLICT', statusCode: 409 });
    });
  });

  describe('reschedule()', () => {
    it('PATCHes /v1/emails/:id with scheduledAt as ISO string and unwraps data', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1', scheduledAt: '2030-01-01T09:00:00.000Z' } }));
      const result = await tratto.emails.reschedule('em_1', new Date('2030-01-01T09:00:00Z'));

      const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/v1/emails/em_1`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body as string)).toEqual({ scheduledAt: '2030-01-01T09:00:00.000Z' });
      expect(result).toEqual({ id: 'em_1', scheduledAt: '2030-01-01T09:00:00.000Z' });
    });

    it('sends a string scheduledAt unchanged', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1', scheduledAt: '2030-01-01T09:00:00.000Z' } }));
      await tratto.emails.reschedule('em_1', '2030-01-01T09:00:00Z');
      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({ scheduledAt: '2030-01-01T09:00:00Z' });
    });

    it('throws a TrattoError on 429 QUOTA_EXCEEDED for a full target month', async () => {
      vi.stubGlobal('fetch', mock({ error: { code: 'QUOTA_EXCEEDED', message: 'Monthly quota exceeded.' } }, 429));
      const err = await tratto.emails.reschedule('em_1', '2030-02-01T09:00:00Z').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(TrattoError);
      expect(err).toMatchObject({ code: 'QUOTA_EXCEEDED', statusCode: 429 });
    });
  });
});
