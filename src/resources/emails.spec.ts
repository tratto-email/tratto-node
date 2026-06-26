import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';

const mock = (data: unknown, status = 200) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300, status, statusText: 'OK',
    json: () => Promise.resolve(data),
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

    it('includes Idempotency-Key header when provided', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' }, 'key-123');

      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('key-123');
    });

    it('omits Idempotency-Key when not provided', async () => {
      vi.stubGlobal('fetch', mock({ data: { id: 'em_1' } }));
      await tratto.emails.send({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' });

      const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toBeUndefined();
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
});
