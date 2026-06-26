import { BaseResource } from './base';
import type {
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyParams,
  ListApiKeysParams,
  PaginatedResponse,
} from '../types';

export class ApiKeysResource extends BaseResource {
  create(params: CreateApiKeyParams, idempotencyKey?: string): Promise<ApiKeyCreated> {
    return this.fetchData<ApiKeyCreated>('POST', '/v1/api-keys', {
      body: params,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  }

  list(params?: ListApiKeysParams): Promise<PaginatedResponse<ApiKey>> {
    const qs = this.buildQuery({ after: params?.after, limit: params?.limit });
    return this.fetch<PaginatedResponse<ApiKey>>('GET', `/v1/api-keys${qs}`);
  }

  revoke(id: string): Promise<{ id: string; revokedAt: string }> {
    return this.fetchData<{ id: string; revokedAt: string }>('DELETE', `/v1/api-keys/${id}`);
  }
}
