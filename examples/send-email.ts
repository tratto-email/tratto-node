/**
 * Example: Send transactional emails — plain HTML, template-based, with idempotency.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/send-email.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Send a plain-HTML email ────────────────────────────────────────────
  const { id } = await tratto.emails.send({
    from: 'Acme <hello@mail.acme.com>',
    to: 'user@example.com',
    subject: 'Welcome to Acme!',
    html: '<h1>Welcome!</h1><p>Thanks for joining. We are glad to have you.</p>',
    text: 'Welcome! Thanks for joining.',
  });
  console.log('Plain email sent:', id);

  // ── 2. Send using a saved template ───────────────────────────────────────
  const templated = await tratto.emails.send({
    from: 'hello@mail.acme.com',
    to: 'alice@example.com',
    subject: 'Your receipt',
    templateId: 'tpl_abc123',
    variables: { name: 'Alice', amount: '$49.00' },
  });
  console.log('Template email sent:', templated.id);

  // ── 3. Send with idempotency key (safe to retry) ──────────────────────────
  const idempotent = await tratto.emails.send(
    {
      from: 'hello@mail.acme.com',
      to: 'bob@example.com',
      subject: 'Password reset',
      html: '<p>Click <a href="https://acme.com/reset">here</a> to reset your password.</p>',
    },
    `reset-${Date.now()}`,
  );
  console.log('Idempotent email sent:', idempotent.id);

  // ── 4. Inspect full email detail ─────────────────────────────────────────
  const detail = await tratto.emails.get(id);
  console.log('\nEmail detail:');
  console.log('  Status:', detail.status);
  console.log('  Events:', detail.events.length);

  // ── 5. List recent delivered emails ──────────────────────────────────────
  const { data, pagination } = await tratto.emails.list({
    status: 'delivered',
    limit: 5,
  });
  console.log(`\nFetched ${data.length} delivered emails, hasMore: ${pagination.hasMore}`);
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
    if (err.docs) console.error('Docs:', err.docs);
  } else {
    console.error(err);
  }
  process.exit(1);
});
