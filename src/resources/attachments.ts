import { BaseResource } from './base';
import type { Attachment, AttachmentContent, UploadAttachmentParams } from '../types';

/**
 * `Content-Disposition` for `filename`. Printable ASCII goes in a quoted
 * `filename`; anything else in `filename*=UTF-8''…` (RFC 6266 / RFC 5987),
 * with an ASCII fallback, because header values must be ASCII.
 */
export function contentDisposition(filename: string): string {
  const quoted = (s: string) => `"${s.replace(/[\\"]/g, '\\$&')}"`;
  if (/^[\x20-\x7e]*$/.test(filename)) return `attachment; filename=${quoted(filename)}`;
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_');
  return `attachment; filename=${quoted(fallback)}; filename*=UTF-8''${encoded}`;
}

export class AttachmentsResource extends BaseResource {
  /**
   * Uploads a file (raw bytes) and returns its metadata. Reference it from
   * `emails.send()` or `emails.sendBatch()` with `attachments: [{ id }]`.
   * Not available on the Free plan (403 `PLAN_UPGRADE_REQUIRED`); a full
   * workspace storage answers 429 `QUOTA_EXCEEDED`.
   */
  upload(content: AttachmentContent, params: UploadAttachmentParams): Promise<Attachment> {
    return this.fetchData<Attachment>('POST', '/v1/attachments', {
      body: content,
      contentType: params.contentType,
      headers: { 'Content-Disposition': contentDisposition(params.filename) },
    });
  }

  /** Metadata only: the bytes are never served back. */
  get(id: string): Promise<Attachment> {
    return this.fetchData<Attachment>('GET', `/v1/attachments/${id}`);
  }

  /** Frees its storage at once. Emails already queued with it fail with `attachment_unavailable`. */
  delete(id: string): Promise<void> {
    return this.fetch<void>('DELETE', `/v1/attachments/${id}`);
  }
}
