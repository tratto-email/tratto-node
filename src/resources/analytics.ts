import { BaseResource } from './base';
import type { AnalyticsPeriod, AnalyticsSummary, TimeseriesPoint } from '../types';

export class AnalyticsResource extends BaseResource {
  getSummary(period: AnalyticsPeriod = '30d'): Promise<AnalyticsSummary> {
    return this.fetchData<AnalyticsSummary>(
      'GET',
      `/v1/analytics/summary${this.buildQuery({ period })}`,
    );
  }

  getTimeseries(period: AnalyticsPeriod = '30d'): Promise<TimeseriesPoint[]> {
    return this.fetchData<TimeseriesPoint[]>(
      'GET',
      `/v1/analytics/timeseries${this.buildQuery({ period })}`,
    );
  }
}
