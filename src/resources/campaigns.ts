import { BaseResource } from './base';
import type {
  Campaign,
  CampaignStatsDetail,
  CreateCampaignParams,
  ListCampaignsParams,
  SendCampaignParams,
  PaginatedResponse,
} from '../types';

export class CampaignsResource extends BaseResource {
  create(params: CreateCampaignParams): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('POST', '/v1/campaigns', { body: params });
  }

  list(params?: ListCampaignsParams): Promise<PaginatedResponse<Campaign>> {
    const qs = this.buildQuery({
      status: params?.status,
      after: params?.after,
      limit: params?.limit,
    });
    return this.fetch<PaginatedResponse<Campaign>>('GET', `/v1/campaigns${qs}`);
  }

  get(id: string): Promise<Campaign> {
    return this.fetchData<Campaign>('GET', `/v1/campaigns/${id}`);
  }

  getStats(id: string): Promise<CampaignStatsDetail> {
    return this.fetchData<CampaignStatsDetail>('GET', `/v1/campaigns/${id}/stats`);
  }

  send(id: string, params?: SendCampaignParams): Promise<{ status: string }> {
    const body: Record<string, unknown> = {};
    if (params?.scheduledAt) {
      body['scheduledAt'] =
        params.scheduledAt instanceof Date
          ? params.scheduledAt.toISOString()
          : params.scheduledAt;
    }
    return this.fetchData<{ status: string }>('POST', `/v1/campaigns/${id}/send`, { body });
  }

  /**
   * Cancel a scheduled send: the campaign goes back to `draft` and its
   * `scheduledAt` is cleared.
   *
   * Only a campaign still waiting for its date can be unscheduled. Anything
   * else answers 409: a send already running, a campaign in any other status,
   * or one that has already sent a test wave to part of its list and is
   * waiting for the bounce rate before sending the rest. In those cases the
   * emails already out cannot be recalled, so `pause()` is the way to stop it.
   */
  unschedule(id: string): Promise<{ id: string; status: 'draft'; scheduledAt: null }> {
    return this.fetchData<{ id: string; status: 'draft'; scheduledAt: null }>(
      'POST',
      `/v1/campaigns/${id}/unschedule`,
      { body: {} },
    );
  }

  pause(id: string): Promise<{ status: string }> {
    return this.fetchData<{ status: string }>('POST', `/v1/campaigns/${id}/pause`, { body: {} });
  }

  testSend(id: string, to: string): Promise<{ emailId: string }> {
    return this.fetchData<{ emailId: string }>(
      'POST',
      `/v1/campaigns/${id}/test-send`,
      { body: { to } },
    );
  }
}
