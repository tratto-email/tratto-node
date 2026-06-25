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
