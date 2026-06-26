import { BaseResource } from './base';
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookParams,
  ListWebhookDeliveriesParams,
  PaginatedResponse,
} from '../types';

export class WebhooksResource extends BaseResource {
  create(params: CreateWebhookParams): Promise<{ id: string; secret: string }> {
    return this.fetchData<{ id: string; secret: string }>('POST', '/v1/webhooks', { body: params });
  }

  list(): Promise<Webhook[]> {
    return this.fetchData<Webhook[]>('GET', '/v1/webhooks');
  }

  delete(id: string): Promise<void> {
    return this.fetch<void>('DELETE', `/v1/webhooks/${id}`);
  }

  listDeliveries(
    id: string,
    params?: ListWebhookDeliveriesParams,
  ): Promise<PaginatedResponse<WebhookDelivery>> {
    const qs = this.buildQuery({ after: params?.after, limit: params?.limit });
    return this.fetch<PaginatedResponse<WebhookDelivery>>(
      'GET',
      `/v1/webhooks/${id}/deliveries${qs}`,
    );
  }

  test(id: string): Promise<{ queued: boolean }> {
    return this.fetchData<{ queued: boolean }>('POST', `/v1/webhooks/${id}/test`, { body: {} });
  }

  rotateSecret(id: string): Promise<{ secret: string }> {
    return this.fetchData<{ secret: string }>(
      'POST',
      `/v1/webhooks/${id}/rotate-secret`,
      { body: {} },
    );
  }
}
