/**
 * Example: The full life of a template — create, edit, version history,
 * test send, delete.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/templates.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Create an emailmd template ────────────────────────────────────────
  // Pass `markdown` and the SDK marks the template as emailmd: the server
  // renders responsive HTML (and a text part) at save time. Pass `html`
  // instead to keep your own markup — the two are mutually exclusive.
  const tpl = await tratto.templates.create({
    name: 'Order confirmation',
    markdown: [
      '# Thanks for your order, {{firstName}}',
      '',
      'Order **{{orderId}}** is confirmed. We will email you again when it ships.',
    ].join('\n'),
  });
  console.log('Created:', tpl.id, `(format: ${tpl.format}, version ${tpl.version})`);
  if (tpl.renderWarnings?.length) console.log('  render warnings:', tpl.renderWarnings);

  // ── 2. Edit it, then publish ─────────────────────────────────────────────
  const edited = await tratto.templates.update(tpl.id, {
    markdown: [
      '# Thanks for your order, {{firstName}}',
      '',
      'Order **{{orderId}}** is confirmed.',
      '',
      '[Track your shipment]({{trackingUrl}})',
    ].join('\n'),
  });
  console.log('Edited, now at version', edited.version);

  const published = await tratto.templates.update(tpl.id, { status: 'published' });
  console.log('Status:', published.status);

  // ── 3. Version history ───────────────────────────────────────────────────
  const versions = await tratto.templates.listVersions(tpl.id);
  console.log(`\n${versions.length} versions:`);
  for (const v of versions) console.log(`  v${v.version}  saved ${v.savedAt}`);

  const first = await tratto.templates.getVersion(tpl.id, versions[versions.length - 1]!.version);
  console.log(`Oldest version HTML is ${first.html.length} chars`);

  // ── 4. Send yourself a test ──────────────────────────────────────────────
  // Rejected with 403 TEST_MODE_NOT_SUPPORTED on a tratto_test_ key: this one
  // reaches a real inbox.
  const { queued } = await tratto.templates.testSend(tpl.id, 'me@acme.com', {
    firstName: 'Alice',
    orderId: 'A-1234',
    trackingUrl: 'https://acme.com/track/A-1234',
  });
  console.log('Test send queued:', queued);

  // ── 5. Read one, list them all ───────────────────────────────────────────
  const fetched = await tratto.templates.get(tpl.id);
  console.log('Fetched back:', fetched.name);

  const { data, pagination } = await tratto.templates.list({ status: 'published', limit: 10 });
  console.log(`\n${data.length} published templates, hasMore: ${pagination.hasMore}`);

  // ── 6. Delete ────────────────────────────────────────────────────────────
  await tratto.templates.delete(tpl.id);
  console.log('Deleted', tpl.id);
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
