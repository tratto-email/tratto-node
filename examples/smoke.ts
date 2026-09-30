/**
 * Smoke test: one real round-trip against the API, in test mode.
 *
 * Creates a contact, creates a template, sends an email to a simulator
 * address, reads the delivery status back, then cleans up what it created.
 * It is the only thing in this repo that talks to a real server — everything
 * else stubs `fetch`. Run it by hand before releasing the SDK; it is
 * deliberately NOT wired into CI.
 *
 * Setup:
 *   cp examples/.env.example examples/.env   # then fill it in
 *
 * Run:
 *   npx tsx --env-file=examples/.env examples/smoke.ts
 *
 * Safety: it refuses to start without a `tratto_test_…` key, and it only
 * ever sends to `delivered@simulator.tratto.email`. No real inbox is
 * touched and the account's sending reputation does not move.
 */
import { Tratto, TrattoError } from '../src/index';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    console.error('Copy examples/.env.example to examples/.env and fill in every variable.');
    process.exit(1);
  }
  return value;
}

const apiKey = requireEnv('TRATTO_API_KEY');
const from = requireEnv('TRATTO_FROM_EMAIL');
const baseUrl = process.env['TRATTO_BASE_URL'] || 'https://api-staging.tratto.email';

if (!apiKey.startsWith('tratto_test_')) {
  console.error('TRATTO_API_KEY is not a test-mode key (tratto_test_…).');
  console.error('Refusing to run: only a test key guarantees nothing reaches a real recipient.');
  process.exit(1);
}

/** Recipient that makes test mode simulate a successful delivery. */
const TO = 'delivered@simulator.tratto.email';
/** Tag carried by everything this script creates, so a run can find its own leftovers. */
const TAG = 'sdk-smoke';
const CONTACT_EMAIL = 'sdk-smoke@simulator.tratto.email';
const TERMINAL = ['delivered', 'failed', 'bounced'];

const tratto = new Tratto(apiKey, { baseUrl });
const stamp = new Date().toISOString();

let templateId: string | undefined;
let contactId: string | undefined;

async function run() {
  console.log(`Smoke test against ${baseUrl} (test mode)\n`);

  // ── 1. Contact ───────────────────────────────────────────────────────────
  // v1 has no contact-delete route, so this reuses the same contact run after
  // run instead of leaving a new one behind each time.
  const { data: existing } = await tratto.contacts.list({ tag: TAG, limit: 1 });
  const previous = existing[0];
  if (previous) {
    contactId = previous.id;
    await tratto.contacts.update(contactId, { status: 'subscribed', customFields: { lastRun: stamp } });
    console.log(`1/4 contact reused   ${contactId} (${previous.email})`);
  } else {
    const created = await tratto.contacts.create({
      email: CONTACT_EMAIL,
      firstName: 'SDK',
      lastName: 'Smoke',
      status: 'subscribed',
      tags: [TAG],
      customFields: { lastRun: stamp },
    });
    contactId = created.id;
    console.log(`1/4 contact created  ${contactId} (${CONTACT_EMAIL})`);
  }

  // ── 2. Template ──────────────────────────────────────────────────────────
  const template = await tratto.templates.create({
    name: `sdk-smoke ${stamp}`,
    markdown: '# Hello {{firstName}}\n\nSDK smoke run at {{stamp}}.',
  });
  templateId = template.id;
  if (template.format !== 'emailmd') {
    throw new Error(`expected format 'emailmd' for a markdown template, got '${template.format}'`);
  }
  console.log(`2/4 template created ${templateId} (format ${template.format}, v${template.version})`);

  // ── 3. Send ──────────────────────────────────────────────────────────────
  const { id: emailId } = await tratto.emails.send(
    {
      from,
      to: TO,
      subject: `SDK smoke ${stamp}`,
      templateId,
      variables: { firstName: 'SDK', stamp },
      tags: [TAG],
    },
    `sdk-smoke-${stamp}`,
  );
  console.log(`3/4 email sent       ${emailId} -> ${TO}`);

  // ── 4. Read the status back ──────────────────────────────────────────────
  const deadline = Date.now() + 60_000;
  let detail = await tratto.emails.get(emailId);
  while (!TERMINAL.includes(detail.status) && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    detail = await tratto.emails.get(emailId);
  }

  const events = await tratto.emails.listEvents(emailId);
  console.log(`4/4 status           ${detail.status} after ${events.length} events`);
  for (const e of events) console.log(`      ${e.occurredAt}  ${e.type}`);

  if (detail.status !== 'delivered') {
    throw new Error(`expected status 'delivered' within 60s, got '${detail.status}'`);
  }
  if (detail.templateId !== templateId) {
    throw new Error(`email reports templateId '${detail.templateId}', expected '${templateId}'`);
  }
}

async function cleanup() {
  console.log('\nCleaning up');
  if (templateId) {
    try {
      await tratto.templates.delete(templateId);
      console.log(`  template ${templateId} deleted`);
    } catch (err) {
      console.error(`  could not delete template ${templateId}:`, describe(err));
    }
  }
  if (contactId) {
    try {
      await tratto.contacts.update(contactId, { status: 'unsubscribed' });
      console.log(`  contact ${contactId} unsubscribed (v1 has no contact-delete route; the next run reuses it)`);
    } catch (err) {
      console.error(`  could not unsubscribe contact ${contactId}:`, describe(err));
    }
  }
  console.log('  the test email itself expires on its own after 7 days');
}

function describe(err: unknown): string {
  return err instanceof TrattoError ? `[${err.statusCode}] ${err.code}: ${err.message}` : String(err);
}

run()
  .then(() => console.log('\nSmoke test passed.'))
  .catch(err => {
    console.error('\nSmoke test FAILED:', describe(err));
    process.exitCode = 1;
  })
  .finally(cleanup);
