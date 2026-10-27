import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifyWebhook } from './index';

// Fixed vectors, computed with tratto-api's own signer (functions/webhookFanout
// signPayload on main). The first is the same vector as tratto-php, so the SDKs
// check each other.
const SECRET = 'whsec_' + 'ab'.repeat(24);
const T = '1784977714054';
const NOW = 1784977714054;
const BODY = '{"id":"evt_1","type":"delivered"}';
const V1 = '05e8e3cddebbeca892e5fd50622431ca3059594f22001ef9f7a2c0566a44fcc8';
const UTF8_BODY = '{"n":"caffè"}';
const UTF8_V1 = '3bc9ef67a7cc2d13615aa739061f94aa60c6ad87eac4477bbd0984e4d7e27d77';

const sign = (t: string, body = BODY) =>
  createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
const verify = (header: string | null | undefined, body: string | Uint8Array = BODY, secret = SECRET, toleranceSeconds = 300, nowMs = NOW) =>
  verifyWebhook(body, header, secret, { toleranceSeconds, nowMs });

describe('verifyWebhook', () => {
  it('accepts the fixed vectors', () => {
    expect(sign(T)).toBe(V1);
    expect(verify(`t=${T},v1=${V1}`)).toBe(true);
    expect(verify(`t=${T},v1=${UTF8_V1}`, UTF8_BODY)).toBe(true);
  });

  it('accepts the raw body as bytes, the same as the string', () => {
    expect(verify(`t=${T},v1=${V1}`, Buffer.from(BODY))).toBe(true);
    expect(verify(`t=${T},v1=${UTF8_V1}`, new TextEncoder().encode(UTF8_BODY))).toBe(true);
  });

  it('accepts whitespace, uppercase hex and unknown fields', () => {
    expect(verify(` t = ${T} , v1 = ${V1.toUpperCase()} ,v2=future,junk`)).toBe(true);
    expect(verify(`junk,t=${T},,x=1=2,v1=${V1}`)).toBe(true);
  });

  it('accepts any of several v1, in any field order', () => {
    const other = '0'.repeat(64);
    expect(verify(`t=${T},v1=${other},v1=${V1}`)).toBe(true);
    expect(verify(`t=${T},v1=${V1},v1=${other}`)).toBe(true);
    expect(verify(`v1=${V1},t=${T}`)).toBe(true);
  });

  it('accepts the signature only under v1', () => {
    for (const field of ['v0', 'v2', 'V1', 'sig', 't1']) {
      expect(verify(`t=${T},${field}=${V1}`), field).toBe(false);
    }
  });

  it('rejects a v1 with extra characters after a valid signature', () => {
    expect(verify(`t=${T},v1=${V1}00`)).toBe(false);
    expect(verify(`t=${T},v1=${V1}zz`)).toBe(false);
  });

  it('rejects signed timestamps that are not pure digits', () => {
    for (const t of [`+${T}`, `${T}x`, `${T} 1`, `x${T}`, `${T}.5`, '1e12']) {
      expect(verify(`t=${t},v1=${sign(t)}`), t).toBe(false);
    }
  });

  it('rejects two timestamps', () => {
    expect(verify(`t=${T},t=${T},v1=${V1}`)).toBe(false);
  });

  it('signs the timestamp string as received, never re-formatted', () => {
    expect(verify(`t=0${T},v1=${V1}`)).toBe(false);
    expect(verify(`t=0${T},v1=${sign(`0${T}`)}`)).toBe(true);
  });

  it('rejects when no v1 matches, or none is present', () => {
    expect(verify(`t=${T},v1=${'0'.repeat(64)},v1=${'f'.repeat(64)}`)).toBe(false);
    expect(verify(`t=${T}`)).toBe(false);
    expect(verify(`v1=${V1}`)).toBe(false);
    expect(verify('')).toBe(false);
    expect(verify(null)).toBe(false);
    expect(verify(undefined)).toBe(false);
  });

  it('rejects a wrong secret, including one without the whsec_ prefix', () => {
    expect(verify(`t=${T},v1=${V1}`, BODY, 'whsec_' + 'ab'.repeat(23) + 'ac')).toBe(false);
    expect(verify(`t=${T},v1=${V1}`, BODY, 'ab'.repeat(24))).toBe(false);
  });

  it('rejects a body altered by one byte, and the body signed alone', () => {
    expect(verify(`t=${T},v1=${V1}`, '{"id":"evt_2","type":"delivered"}')).toBe(false);
    expect(verify(`t=${T},v1=${V1}`, BODY + ' ')).toBe(false);
    expect(verify(`t=${T},v1=${createHmac('sha256', SECRET).update(BODY).digest('hex')}`)).toBe(false);
  });

  it('applies the tolerance in both directions, inclusive', () => {
    const h = `t=${T},v1=${V1}`;
    expect(verify(h, BODY, SECRET, 300, NOW + 300_000)).toBe(true);
    expect(verify(h, BODY, SECRET, 300, NOW - 300_000)).toBe(true);
    expect(verify(h, BODY, SECRET, 300, NOW + 300_001)).toBe(false);
    expect(verify(h, BODY, SECRET, 300, NOW - 300_001)).toBe(false);
    expect(verify(h, BODY, SECRET, 0, NOW)).toBe(true);
    expect(verify(h, BODY, SECRET, 0, NOW + 1)).toBe(false);
  });

  it('defaults to 5 minutes and the current clock', () => {
    const t = String(Date.now() - 299_000);
    expect(verifyWebhook(BODY, `t=${t},v1=${sign(t)}`, SECRET)).toBe(true);
    const old = String(Date.now() - 301_000);
    expect(verifyWebhook(BODY, `t=${old},v1=${sign(old)}`, SECRET)).toBe(false);
  });

  it('throws on configuration errors', () => {
    expect(() => verify(`t=${T},v1=${V1}`, BODY, '')).toThrow(/secret/);
    expect(() => verify(`t=${T},v1=${V1}`, BODY, SECRET, -1)).toThrow(/toleranceSeconds/);
  });
});
