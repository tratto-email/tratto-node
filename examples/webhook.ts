/**
 * Example: Register a webhook, send a test event, and inspect delivery history.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/webhook.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Register a webhook endpoint ───────────────────────────────────────
  const { id, secret } = await tratto.webhooks.create({
    url: 'https://my-app.example.com/webhooks/tratto',
    events: ['delivered', 'bounced', 'complained', 'unsubscribed'],
  });

  // The secret is shown only at creation time — store it in your environment
  console.log('Webhook registered:', id);
  console.log('Signing secret (save this!):', secret);
  console.log('Verify incoming payloads using X-Tratto-Signature.');

  // ── 2. List all webhooks ──────────────────────────────────────────────────
  const hooks = await tratto.webhooks.list();
  console.log(`\nRegistered webhooks: ${hooks.length}`);
  for (const h of hooks) {
    console.log(`  ${h.id}  ${h.url}  [${h.status}]  events: ${h.events.join(', ')}`);
  }

  // ── 3. Send a test event ──────────────────────────────────────────────────
  const { queued } = await tratto.webhooks.test(id);
  console.log('\nTest event queued:', queued);

  // ── 4. Inspect delivery history ──────────────────────────────────────────
  const { data: deliveries } = await tratto.webhooks.listDeliveries(id, { limit: 10 });
  console.log(`\nLast ${deliveries.length} deliveries:`);
  for (const d of deliveries) {
    const status = d.status === 'success' ? '✓' : '✗';
    console.log(`  ${status} ${d.attemptedAt}  ${d.eventType}  HTTP ${d.httpStatus ?? 'n/a'}`);
  }

  // ── 5. Rotate the signing secret ─────────────────────────────────────────
  const { secret: newSecret } = await tratto.webhooks.rotateSecret(id);
  console.log('\nNew secret (update your server env!):', newSecret);

  // ── 6. Clean up ──────────────────────────────────────────────────────────
  await tratto.webhooks.delete(id);
  console.log('Webhook deleted');
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
