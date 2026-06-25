import { BaseResource } from './base';
import type {
  Template,
  TemplateSummary,
  TemplateVersion,
  TemplateVersionSummary,
  CreateTemplateParams,
  UpdateTemplateParams,
  ListTemplatesParams,
  PaginatedResponse,
} from '../types';

export class TemplatesResource extends BaseResource {
  list(params?: ListTemplatesParams): Promise<PaginatedResponse<TemplateSummary>> {
    const qs = this.buildQuery({
      limit: params?.limit,
      after: params?.after,
      status: params?.status,
    });
    return this.fetch<PaginatedResponse<TemplateSummary>>('GET', `/v1/templates${qs}`);
  }

  create(params: CreateTemplateParams): Promise<Template> {
    return this.fetchData<Template>('POST', '/v1/templates', { body: params });
  }

  get(id: string): Promise<Template> {
    return this.fetchData<Template>('GET', `/v1/templates/${id}`);
  }

  update(id: string, params: UpdateTemplateParams): Promise<Template> {
    return this.fetchData<Template>('PATCH', `/v1/templates/${id}`, { body: params });
  }

  delete(id: string): Promise<void> {
    return this.fetch<void>('DELETE', `/v1/templates/${id}`);
  }

  listVersions(id: string): Promise<TemplateVersionSummary[]> {
    return this.fetchData<TemplateVersionSummary[]>('GET', `/v1/templates/${id}/versions`);
  }

  getVersion(id: string, version: number): Promise<TemplateVersion> {
    return this.fetchData<TemplateVersion>('GET', `/v1/templates/${id}/versions/${version}`);
  }

  testSend(
    id: string,
    to: string,
    variables: Record<string, string> = {},
  ): Promise<{ queued: boolean }> {
    return this.fetchData<{ queued: boolean }>(
      'POST',
      `/v1/templates/${id}/test-send`,
      { body: { to, variables } },
    );
  }
}
