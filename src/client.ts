import { TrattoError } from './error';
import { DEFAULT_TIMEOUT_MS } from './resources/base';
import { EmailsResource } from './resources/emails';
import { ContactsResource } from './resources/contacts';
import { AudiencesResource } from './resources/audiences';
import { CampaignsResource } from './resources/campaigns';
import { TemplatesResource } from './resources/templates';
import { WebhooksResource } from './resources/webhooks';
import { DomainsResource } from './resources/domains';
import { AnalyticsResource } from './resources/analytics';
import { FlowsResource } from './resources/flows';
import { WorkspaceResource } from './resources/workspace';
import { AttachmentsResource } from './resources/attachments';

export interface TrattoOptions {
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 60000 (60 s). */
  timeout?: number;
}

export class Tratto {
  readonly emails: EmailsResource;
  readonly contacts: ContactsResource;
  readonly audiences: AudiencesResource;
  readonly campaigns: CampaignsResource;
  readonly templates: TemplatesResource;
  readonly webhooks: WebhooksResource;
  readonly domains: DomainsResource;
  readonly analytics: AnalyticsResource;
  readonly flows: FlowsResource;
  readonly workspace: WorkspaceResource;
  readonly attachments: AttachmentsResource;

  constructor(apiKey: string, options?: TrattoOptions) {
    if (!apiKey) throw new Error('apiKey is required');
    const baseUrl = (options?.baseUrl ?? 'https://api.tratto.email').replace(/\/$/, '');
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    if (!(timeout > 0)) throw new Error('timeout must be a positive number of milliseconds');
    this.emails = new EmailsResource(apiKey, baseUrl, timeout);
    this.contacts = new ContactsResource(apiKey, baseUrl, timeout);
    this.audiences = new AudiencesResource(apiKey, baseUrl, timeout);
    this.campaigns = new CampaignsResource(apiKey, baseUrl, timeout);
    this.templates = new TemplatesResource(apiKey, baseUrl, timeout);
    this.webhooks = new WebhooksResource(apiKey, baseUrl, timeout);
    this.domains = new DomainsResource(apiKey, baseUrl, timeout);
    this.analytics = new AnalyticsResource(apiKey, baseUrl, timeout);
    this.flows = new FlowsResource(apiKey, baseUrl, timeout);
    this.workspace = new WorkspaceResource(apiKey, baseUrl, timeout);
    this.attachments = new AttachmentsResource(apiKey, baseUrl, timeout);
  }
}

export { TrattoError };
