import { BaseResource } from './base';
import type {
  Flow,
  CreateFlowParams,
  UpdateFlowParams,
  ListFlowsParams,
  PaginatedResponse,
} from '../types';

export class FlowsResource extends BaseResource {
  list(params?: ListFlowsParams): Promise<PaginatedResponse<Flow>> {
    const qs = this.buildQuery({ after: params?.after, limit: params?.limit });
    return this.fetch<PaginatedResponse<Flow>>('GET', `/v1/flows${qs}`);
  }

  create(params: CreateFlowParams): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('POST', '/v1/flows', { body: params });
  }

  get(id: string): Promise<Flow> {
    return this.fetchData<Flow>('GET', `/v1/flows/${id}`);
  }

  update(id: string, params: UpdateFlowParams): Promise<Flow> {
    return this.fetchData<Flow>('PATCH', `/v1/flows/${id}`, { body: params });
  }

  delete(id: string): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('DELETE', `/v1/flows/${id}`);
  }

  activate(id: string): Promise<Flow> {
    return this.fetchData<Flow>('POST', `/v1/flows/${id}/activate`, { body: {} });
  }

  deactivate(id: string): Promise<Flow> {
    return this.fetchData<Flow>('POST', `/v1/flows/${id}/deactivate`, { body: {} });
  }
}
