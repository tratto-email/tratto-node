/**
 * Example: Add a sending domain, print the DNS records, verify it.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/domains.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Add the domain ────────────────────────────────────────────────────
  const domain = await tratto.domains.add('mail.acme.com');
  console.log('Added:', domain.id, `(status: ${domain.status})`);

  // ── 2. Publish these records in your DNS ─────────────────────────────────
  console.log('\nDNS records to create:');
  for (const r of domain.records) {
    console.log(`  ${r.type.padEnd(5)} ${r.host}`);
    console.log(`        ${r.value}`);
  }

  // ── 3. Ask Tratto to check them ──────────────────────────────────────────
  // DNS takes minutes to hours to propagate; call verify() again later
  // instead of blocking here.
  const verified = await tratto.domains.verify(domain.id);
  console.log('\nAfter verify:', verified.status);
  const missing = verified.records.filter(r => !r.verified);
  if (missing.length > 0) {
    console.log('Still missing:', missing.map(r => `${r.type} ${r.host}`).join(', '));
  }

  // ── 4. Read one, list them all ───────────────────────────────────────────
  const fetched = await tratto.domains.get(domain.id);
  console.log(`\n${fetched.domain}: DKIM selector ${fetched.dkimSelector}, verified at ${fetched.verifiedAt ?? 'never'}`);

  const { data, pagination } = await tratto.domains.list({ limit: 20 });
  console.log(`\n${data.length} domains, hasMore: ${pagination.hasMore}`);
  for (const d of data) console.log(`  ${d.domain.padEnd(30)} ${d.status}`);

  // ── 5. Remove it ─────────────────────────────────────────────────────────
  const { deletedAt } = await tratto.domains.delete(domain.id);
  console.log('Deleted at', deletedAt);
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
