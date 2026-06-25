import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tratto } from '../client';

const API_KEY = 'tratto_test_key';
const BASE = 'https://api.tratto.email';
const mock = (data: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(data) });
const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

const SUMMARY = { period: '30d', totalSent: 1000, delivered: 980, opened: 400, clicked: 100, bounced: 20, complained: 2, deliveryRate: 98, openRate: 40, clickRate: 10, bounceRate: 2 };

describe('AnalyticsResource', () => {
  let tratto: Tratto;
  beforeEach(() => { tratto = new Tratto(API_KEY); });
  afterEach(() => vi.unstubAllGlobals());

  describe('getSummary()', () => {
    it('GETs /v1/analytics/summary with default period 30d', async () => {
      vi.stubGlobal('fetch', mock({ data: SUMMARY }));
      const result = await tratto.analytics.getSummary();
      const [url] = fetchCalls()[0] as [string];
      expect(url).toContain(`${BASE}/v1/analytics/summary`);
      expect(url).toContain('period=30d');
      expect(result).toEqual(SUMMARY);
    });

    it('uses the provided period', async () => {
      vi.stubGlobal('fetch', mock({ data: { ...SUMMARY, period: '7d' } }));
      await tratto.analytics.getSummary('7d');
      const [url] = fetchCalls()[0] as [string];
      expect(url).toContain('period=7d');
    });
  });

  describe('getTimeseries()', () => {
    it('GETs /v1/analytics/timeseries with default period 30d', async () => {
      const points = [{ date: '2025-01-01', sent: 10, delivered: 9, opened: 4, bounced: 1 }];
      vi.stubGlobal('fetch', mock({ data: points }));
      const result = await tratto.analytics.getTimeseries();
      const [url] = fetchCalls()[0] as [string];
      expect(url).toContain(`${BASE}/v1/analytics/timeseries`);
      expect(url).toContain('period=30d');
      expect(result).toEqual(points);
    });

    it('uses the provided period', async () => {
      vi.stubGlobal('fetch', mock({ data: [] }));
      await tratto.analytics.getTimeseries('90d');
      const [url] = fetchCalls()[0] as [string];
      expect(url).toContain('period=90d');
    });
  });
});
