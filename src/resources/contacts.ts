import { BaseResource } from './base';
import type {
  Contact,
  CreateContactParams,
  UpdateContactParams,
  ListContactsParams,
  ImportJobStatus,
  PaginatedResponse,
} from '../types';

export class ContactsResource extends BaseResource {
  create(params: CreateContactParams): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('POST', '/v1/contacts', { body: params });
  }

  list(params?: ListContactsParams): Promise<PaginatedResponse<Contact>> {
    const qs = this.buildQuery({
      status: params?.status,
      audienceId: params?.audienceId,
      tag: params?.tag,
      after: params?.after,
      limit: params?.limit,
    });
    return this.fetch<PaginatedResponse<Contact>>('GET', `/v1/contacts${qs}`);
  }

  update(id: string, params: UpdateContactParams): Promise<{ id: string }> {
    return this.fetchData<{ id: string }>('PATCH', `/v1/contacts/${id}`, { body: params });
  }

  importCsv(csvText: string): Promise<{ jobId: string; totalRows: number }> {
    return this.fetchData<{ jobId: string; totalRows: number }>(
      'POST',
      '/v1/contacts/import',
      { body: csvText, contentType: 'text/csv' },
    );
  }

  getImportJob(jobId: string): Promise<ImportJobStatus> {
    return this.fetchData<ImportJobStatus>('GET', `/v1/contacts/import/${jobId}`);
  }
}
