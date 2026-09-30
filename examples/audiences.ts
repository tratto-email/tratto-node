/**
 * Example: Build a dynamic audience and add contacts to it.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/audiences.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Create an audience from rules ─────────────────────────────────────
  // Rules are evaluated server-side: the audience stays in sync as contacts
  // change, you never re-upload a list.
  const { id } = await tratto.audiences.create({
    name: 'Pro plan, tagged vip',
    description: 'Subscribed contacts on the pro plan carrying the vip tag',
    rules: [
      { field: 'status', operator: 'equals', value: 'subscribed' },
      { field: 'customFields.plan', operator: 'equals', value: 'pro' },
      { field: 'tags', operator: 'array_contains', value: 'vip' },
    ],
  });
  console.log('Audience created:', id);

  // ── 2. Read it back ──────────────────────────────────────────────────────
  const audience = await tratto.audiences.get(id);
  console.log(`  ${audience.name}: ${audience.contactCount} contacts, ${audience.rules.length} rules`);

  // ── 3. Add specific contacts on top of the rules ─────────────────────────
  const { data: contacts } = await tratto.contacts.list({ status: 'subscribed', limit: 3 });
  if (contacts.length > 0) {
    const result = await tratto.audiences.addContacts(id, contacts.map(c => c.id));
    console.log(
      `Added ${result.added}, already in audience ${result.alreadyInAudience}, not found ${result.notFound}`,
    );
  }

  // ── 4. List every audience ───────────────────────────────────────────────
  const { data, pagination } = await tratto.audiences.list({ limit: 20 });
  console.log(`\n${data.length} audiences, hasMore: ${pagination.hasMore}`);
  for (const a of data) {
    console.log(`  ${a.id}  ${a.name}  (${a.contactCount} contacts)`);
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
