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
    // The API's create schema requires format: 'emailmd' whenever markdown is
    // present ("markdown requires format 'emailmd'.") — inferred here so the
    // caller only chooses WHICH content field to pass. Caught by a docs
    // fact-check against the live staging contract before 1.1.0 shipped.
    const body =
      params.markdown !== undefined ? { ...params, format: 'emailmd' as const } : params;
    return this.fetchData<Template>('POST', '/v1/templates', { body });
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
