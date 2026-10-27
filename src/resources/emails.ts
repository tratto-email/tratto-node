import { BaseResource, path } from './base';
import type {
  SendEmailParams,
  BatchEmailParams,
  SendBatchResponse,
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

  /**
   * Sends up to 100 emails in one request. One `Idempotency-Key` covers the
   * whole batch. Resolves on every 202, also when some emails failed
   * (`failed > 0`): retry only those, in a new batch with a new key.
   */
  sendBatch(emails: BatchEmailParams[], idempotencyKey?: string): Promise<SendBatchResponse> {
    return this.fetchData<SendBatchResponse>('POST', '/v1/emails/batch', {
      body: { emails },
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
    return this.fetchData<EmailDetail>('GET', path`/v1/emails/${id}`);
  }

  listEvents(id: string): Promise<EmailEvent[]> {
    return this.fetchData<EmailEvent[]>('GET', path`/v1/emails/${id}/events`);
  }

  /**
   * Cancels an email still in `scheduled` and gives its quota back. Any other
   * status answers 409. Can answer 429 RATE_LIMITED: safe to retry.
   */
  cancel(id: string): Promise<void> {
    return this.fetch<void>('DELETE', path`/v1/emails/${id}`);
  }

  /**
   * Moves a scheduled email to a new future date. Moving it to another UTC
   * month can answer 429 QUOTA_EXCEEDED (that month is full); 429
   * RATE_LIMITED is safe to retry.
   */
  reschedule(id: string, scheduledAt: Date | string): Promise<{ id: string; scheduledAt: string }> {
    return this.fetchData<{ id: string; scheduledAt: string }>('PATCH', path`/v1/emails/${id}`, {
      body: { scheduledAt },
    });
  }
}
