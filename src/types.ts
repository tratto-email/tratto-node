// Public types for the Tratto REST API v1.

// ── Shared ────────────────────────────────────────────────────────────────────

export interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ── Emails ────────────────────────────────────────────────────────────────────

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateId?: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  scheduledAt?: Date | string;
  headers?: Record<string, string>;
}

export interface ListEmailsParams {
  after?: string;
  limit?: number;
  status?: string;
  domainId?: string;
  tags?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

export interface EmailSummary {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
  tags?: string[];
}

export interface EmailEvent {
  type: string;
  occurredAt: string;
  data?: Record<string, unknown>;
}

export interface EmailDetail extends EmailSummary {
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateId?: string;
  headers?: Record<string, string>;
  events: EmailEvent[];
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export type ContactStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';

export interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: ContactStatus;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
}

export interface CreateContactParams {
  email: string;
  firstName?: string;
  lastName?: string;
  status?: ContactStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateContactParams {
  firstName?: string;
  lastName?: string;
  status?: ContactStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface ListContactsParams {
  status?: ContactStatus;
  audienceId?: string;
  tag?: string;
  after?: string;
  limit?: number;
}

export interface ImportJobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: string[];
  completedAt: string | null;
}

// ── Audiences ─────────────────────────────────────────────────────────────────

export type AudienceRuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'array_contains';

export interface AudienceRule {
  field: string;
  operator: AudienceRuleOperator;
  value: string | number | boolean;
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  rules: AudienceRule[];
  createdAt: string;
}

export interface CreateAudienceParams {
  name: string;
  description?: string;
  rules?: AudienceRule[];
}

export interface ListAudiencesParams {
  after?: string;
  limit?: number;
}

export interface AddContactsToAudienceResult {
  added: number;
  alreadyInAudience: number;
  notFound: number;
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'sending' | 'scheduled' | 'paused' | 'completed';

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  templateId: string;
  audienceId: string;
  fromName: string;
  fromEmail: string;
  subjectA: string;
  subjectB: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: CampaignStats;
  createdAt: string;
}

export interface CampaignStatsDetail {
  campaignId: string;
  status: CampaignStatus;
  stats: CampaignStats;
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}

export interface CreateCampaignParams {
  name: string;
  templateId: string;
  audienceId: string;
  fromName: string;
  fromEmail: string;
  subjectA: string;
  subjectB?: string;
}

export interface ListCampaignsParams {
  status?: CampaignStatus;
  after?: string;
  limit?: number;
}

export interface SendCampaignParams {
  scheduledAt?: Date | string;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export type TemplateStatus = 'draft' | 'published';

export interface TemplateSummary {
  id: string;
  name: string;
  status: TemplateStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template extends TemplateSummary {
  html: string;
}

export interface CreateTemplateParams {
  name: string;
  html?: string;
}

export interface UpdateTemplateParams {
  name?: string;
  html?: string;
  status?: TemplateStatus;
}

export interface ListTemplatesParams {
  limit?: number;
  after?: string;
  status?: TemplateStatus;
}

export interface TemplateVersionSummary {
  version: number;
  savedAt: string;
}

export interface TemplateVersion extends TemplateVersionSummary {
  html: string;
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed';

export type WebhookStatus = 'active' | 'disabled';
export type WebhookDeliveryStatus = 'success' | 'failed' | 'scheduled';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  secretPrefix: string;
  failureCount: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  status: WebhookDeliveryStatus;
  httpStatus: number | null;
  responseBody: string | null;
  retryCount: number;
  attemptedAt: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
}

export interface ListWebhookDeliveriesParams {
  after?: string;
  limit?: number;
}

// ── Domains ───────────────────────────────────────────────────────────────────

export type DomainStatus = 'pending' | 'verified' | 'failed';

export interface DomainRecord {
  type: string;
  host: string;
  value: string;
  verified: boolean;
}

export interface DomainSummary {
  id: string;
  domain: string;
  status: DomainStatus;
  dkimSelector: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
}

export interface Domain extends DomainSummary {
  records: DomainRecord[];
}

export interface ListDomainsParams {
  after?: string;
  limit?: number;
}

// ── API Keys ──────────────────────────────────────────────────────────────────

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface TimeseriesPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
}

// ── Flows ─────────────────────────────────────────────────────────────────────

export type FlowStatus = 'draft' | 'active' | 'inactive';

export type FlowTriggerType =
  | 'contact_joins_audience'
  | 'contact_tag_added'
  | 'contact_tag_removed'
  | 'email_event'
  | 'manual';

export type FlowStepType =
  | 'send_email'
  | 'wait'
  | 'branch'
  | 'update_contact'
  | 'webhook_call';

export interface FlowTrigger {
  type: FlowTriggerType;
  config: Record<string, string>;
}

export interface FlowStep {
  id: string;
  type: FlowStepType;
  config: Record<string, string>;
}

export interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  trigger: FlowTrigger;
  steps: FlowStep[];
  enrollments: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowParams {
  name: string;
}

export interface UpdateFlowParams {
  name?: string;
  trigger?: FlowTrigger;
  steps?: FlowStep[];
}

export interface ListFlowsParams {
  after?: string;
  limit?: number;
}

// ── Workspace ─────────────────────────────────────────────────────────────────

export type WorkspacePlan = 'free' | 'starter' | 'growth';
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member';
export type WorkspaceLocale = 'it' | 'en';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: WorkspaceLocale;
  plan: WorkspacePlan;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string | null;
  role: WorkspaceMemberRole;
  joinedAt: string;
}

export interface WorkspacePreferences {
  locale: WorkspaceLocale;
  emailNotifications: {
    bounces: boolean;
    weeklyReport: boolean;
    billingAlerts: boolean;
  };
}

export interface UpdateWorkspaceParams {
  name?: string;
  slug?: string;
  timezone?: string;
  locale?: WorkspaceLocale;
}

export interface UpdateWorkspacePreferencesParams {
  locale?: WorkspaceLocale;
  emailNotifications?: {
    bounces?: boolean;
    weeklyReport?: boolean;
    billingAlerts?: boolean;
  };
}

export interface InviteMemberParams {
  email: string;
  role: 'admin' | 'member';
}

export interface UpdateMemberParams {
  role: WorkspaceMemberRole;
}
