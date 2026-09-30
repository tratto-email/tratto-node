/**
 * Example: Build an automation flow — trigger, steps, activation.
 *
 * Flows are the one v1 resource with no granular scopes: there is no
 * `flows:read` or `flows:write`, so every call here needs an API key with
 * the `*` permission. Create one for the job and revoke it right after.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/flows.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Create the flow (name only — it starts as a draft) ────────────────
  const { id } = await tratto.flows.create({ name: 'Welcome series' });
  console.log('Flow created:', id);

  // ── 2. Give it a trigger and its steps ───────────────────────────────────
  const flow = await tratto.flows.update(id, {
    trigger: { type: 'contact_tag_added', config: { tag: 'signed-up' } },
    steps: [
      { id: 'step_1', type: 'send_email', config: { templateId: 'tpl_welcome' } },
      { id: 'step_2', type: 'wait', config: { duration: '2d' } },
      { id: 'step_3', type: 'send_email', config: { templateId: 'tpl_tips' } },
      { id: 'step_4', type: 'update_contact', config: { addTag: 'onboarded' } },
    ],
  });
  console.log(`Configured: trigger ${flow.trigger.type}, ${flow.steps.length} steps`);

  // ── 3. Activate it ───────────────────────────────────────────────────────
  // The sender for flow emails is the workspace `automation` sender, resolved
  // at activation time. Rejected on a tratto_test_ key.
  const active = await tratto.flows.activate(id);
  console.log('Status:', active.status);

  // ── 4. Read one, list them all ───────────────────────────────────────────
  const fetched = await tratto.flows.get(id);
  console.log(`${fetched.name}: ${fetched.enrollments} enrollments`);

  const { data, pagination } = await tratto.flows.list({ limit: 20 });
  console.log(`\n${data.length} flows, hasMore: ${pagination.hasMore}`);
  for (const f of data) console.log(`  ${f.id}  ${f.name.padEnd(24)} ${f.status}`);

  // ── 5. Stop it, then remove it ───────────────────────────────────────────
  // Deactivating stops new enrollments; contacts already inside finish.
  const paused = await tratto.flows.deactivate(id);
  console.log('Status:', paused.status);

  await tratto.flows.delete(id);
  console.log('Flow deleted');
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
