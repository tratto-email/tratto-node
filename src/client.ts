import { TrattoError } from './error';
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

export interface TrattoOptions {
  baseUrl?: string;
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

  constructor(apiKey: string, options?: TrattoOptions) {
    if (!apiKey) throw new Error('apiKey is required');
    const baseUrl = (options?.baseUrl ?? 'https://api.tratto.email').replace(/\/$/, '');
    this.emails = new EmailsResource(apiKey, baseUrl);
    this.contacts = new ContactsResource(apiKey, baseUrl);
    this.audiences = new AudiencesResource(apiKey, baseUrl);
    this.campaigns = new CampaignsResource(apiKey, baseUrl);
    this.templates = new TemplatesResource(apiKey, baseUrl);
    this.webhooks = new WebhooksResource(apiKey, baseUrl);
    this.domains = new DomainsResource(apiKey, baseUrl);
    this.analytics = new AnalyticsResource(apiKey, baseUrl);
    this.flows = new FlowsResource(apiKey, baseUrl);
    this.workspace = new WorkspaceResource(apiKey, baseUrl);
  }
}

export { TrattoError };
