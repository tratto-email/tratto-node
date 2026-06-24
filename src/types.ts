export interface SendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SendEmailResponse {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: string;
  createdAt: string;
}

export interface ListEmailsOptions {
  status?: 'queued' | 'sending' | 'delivered' | 'bounced' | 'complained' | 'failed';
  limit?: number;
  after?: string;
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface ApiError {
  code: string;
  message: string;
  docs?: string;
}
