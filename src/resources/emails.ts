import { BaseResource } from './base';
import type {
  SendEmailParams,
  ListEmailsParams,
  EmailSummary,
  EmailDetail,
  EmailEvent,
  PaginatedResponse,
} from '../types';

export class EmailsResource extends BaseResource {
  send(params: SendEmailParams, idempotencyKey?: string): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('POST', '/v1/emails', {
      body: params,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  }

  list(params?: ListEmailsParams): Promise<PaginatedResponse<EmailSummary>> {
    const qs = this.buildQuery({
      after: params?.after,
      limit: params?.limit,
      status: params?.status,
      domainId: params?.domainId,
      tags: params?.tags,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    });
    return this.fetch<PaginatedResponse<EmailSummary>>('GET', `/v1/emails${qs}`);
  }

  get(id: string): Promise<EmailDetail> {
    return this.fetchData<EmailDetail>('GET', `/v1/emails/${id}`);
  }

  listEvents(id: string): Promise<EmailEvent[]> {
    return this.fetchData<EmailEvent[]>('GET', `/v1/emails/${id}/events`);
  }
}
