/**
 * Example: Contact management and CSV bulk import.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/contacts.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Create a contact ───────────────────────────────────────────────────
  const { id } = await tratto.contacts.create({
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
    tags: ['vip', 'beta-user'],
    customFields: { plan: 'pro', signupSource: 'website' },
  });
  console.log('Created contact:', id);

  // ── 2. Update the contact ─────────────────────────────────────────────────
  await tratto.contacts.update(id, { status: 'subscribed' });
  console.log('Updated contact status to subscribed');

  // ── 3. List subscribed contacts ───────────────────────────────────────────
  const { data, pagination } = await tratto.contacts.list({
    status: 'subscribed',
    limit: 10,
  });
  console.log(`Found ${data.length} subscribed contacts, hasMore: ${pagination.hasMore}`);

  // ── 4. Bulk import via CSV ────────────────────────────────────────────────
  const csv = [
    'email,first_name,last_name,status',
    'bob@example.com,Bob,Jones,subscribed',
    'carol@example.com,Carol,White,subscribed',
    'dave@example.com,Dave,Brown,unsubscribed',
  ].join('\n');

  const { jobId, totalRows } = await tratto.contacts.importCsv(csv);
  console.log(`\nImport job started: ${jobId} (${totalRows} rows)`);

  // ── 5. Poll until complete ────────────────────────────────────────────────
  let job = await tratto.contacts.getImportJob(jobId);
  while (job.status === 'processing') {
    await new Promise(r => setTimeout(r, 1000));
    job = await tratto.contacts.getImportJob(jobId);
    process.stdout.write(`  processed: ${job.processedRows}/${job.totalRows}\r`);
  }
  console.log(`\nImport ${job.status}: ${job.processedRows} ok, ${job.failedRows} failed`);
  if (job.errors.length > 0) {
    console.log('Errors:', job.errors);
  }
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
