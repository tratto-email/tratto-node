import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyWebhookOptions {
  /** Max distance between `t` and now, in the past or in the future. Default 300 (5 minutes). */
  toleranceSeconds?: number;
  /** Current time in milliseconds. Default `Date.now()`; set it in tests. */
  nowMs?: number;
}

/**
 * Verifies the `X-Tratto-Signature` header of a webhook delivery.
 *
 * Header: `t=<unix ms>,v1=<hex>`; `v1` may repeat during a secret rotation.
 * Signature: HMAC-SHA256 of `"{t}.{raw body}"` keyed with the whole secret,
 * `whsec_` prefix included. Pass the raw body exactly as received, before any
 * JSON parsing: a re-serialized body does not match.
 *
 * Returns `true` only for an authentic, fresh delivery. Throws on an empty
 * secret or a negative tolerance (configuration errors).
 */
export function verifyWebhook(
  payload: string | Uint8Array,
  header: string | null | undefined,
  secret: string,
  options: VerifyWebhookOptions = {},
): boolean {
  const { toleranceSeconds = 300, nowMs = Date.now() } = options;
  if (!secret) throw new TypeError('verifyWebhook: secret is required');
  if (!(toleranceSeconds >= 0)) {
    throw new RangeError('verifyWebhook: toleranceSeconds must not be negative');
  }

  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of (header ?? '').split(',')) {
    const pair = part.split('=');
    if (pair.length !== 2) continue; // hex and digits never contain '='
    const name = pair[0]!.trim();
    const value = pair[1]!.trim();
    if (name === 't') {
      if (timestamp !== undefined) return false; // two timestamps: ambiguous, never guess
      timestamp = value;
    } else if (name === 'v1' && value) {
      signatures.push(value.toLowerCase());
    }
  }

  // Digits only: Number() would read "+123", "1e12" or " 123" as a number.
  if (timestamp === undefined || signatures.length === 0 || !/^\d{1,15}$/.test(timestamp)) {
    return false;
  }
  if (Math.abs(nowMs - Number(timestamp)) > toleranceSeconds * 1000) return false;

  // Signed over the timestamp string exactly as received, never a re-formatted number.
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.`).update(payload).digest('hex'),
  );
  return signatures.some((signature) => {
    const actual = Buffer.from(signature);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}
