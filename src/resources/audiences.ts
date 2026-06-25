import { BaseResource } from './base';
import type {
  Audience,
  CreateAudienceParams,
  ListAudiencesParams,
  AddContactsToAudienceResult,
  PaginatedResponse,
} from '../types';

export class AudiencesResource extends BaseResource {
  create(params: CreateAudienceParams): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('POST', '/v1/audiences', { body: params });
  }

  list(params?: ListAudiencesParams): Promise<PaginatedResponse<Audience>> {
    const qs = this.buildQuery({ after: params?.after, limit: params?.limit });
    return this.fetch<PaginatedResponse<Audience>>('GET', `/v1/audiences${qs}`);
  }

  get(id: string): Promise<Audience> {
    return this.fetchData<Audience>('GET', `/v1/audiences/${id}`);
  }

  addContacts(audienceId: string, contactIds: string[]): Promise<AddContactsToAudienceResult> {
    return this.fetchData<AddContactsToAudienceResult>(
      'POST',
      `/v1/audiences/${audienceId}/contacts`,
      { body: { contactIds } },
    );
  }
}
