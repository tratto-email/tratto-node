import { BaseResource } from './base';
import type {
  Domain,
  DomainSummary,
  ListDomainsParams,
  PaginatedResponse,
} from '../types';

export class DomainsResource extends BaseResource {
  add(domain: string): Promise<Domain> {
    return this.fetchData<Domain>('POST', '/v1/domains', { body: { domain } });
  }

  list(params?: ListDomainsParams): Promise<PaginatedResponse<DomainSummary>> {
    const qs = this.buildQuery({ after: params?.after, limit: params?.limit });
    return this.fetch<PaginatedResponse<DomainSummary>>('GET', `/v1/domains${qs}`);
  }

  get(id: string): Promise<Domain> {
    return this.fetchData<Domain>('GET', `/v1/domains/${id}`);
  }

  verify(id: string): Promise<Domain> {
    return this.fetchData<Domain>('POST', `/v1/domains/${id}/verify`, { body: {} });
  }

  delete(id: string): Promise<{ id: string; deletedAt: string }> {
    return this.fetchData<{ id: string; deletedAt: string }>('DELETE', `/v1/domains/${id}`);
  }
}
