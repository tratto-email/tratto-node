/**
 * Example: Read and configure the workspace — senders, preferences, members.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/workspace.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Read the workspace ────────────────────────────────────────────────
  const ws = await tratto.workspace.get();
  console.log(`${ws.name} (${ws.slug})  plan: ${ws.plan}  locale: ${ws.locale}`);
  console.log(`Default sender: ${ws.defaultFromName ?? '—'} <${ws.defaultFromEmail ?? '—'}>`);

  // `senders` is absent on an API older than 0.5.7, and a null entry means
  // that send type inherits the workspace default — never a blocked send.
  for (const type of ['marketing', 'automation', 'transactional'] as const) {
    const sender = ws.senders?.[type];
    console.log(`  ${type.padEnd(14)} ${sender ? `${sender.fromName} <${sender.fromEmail}>` : 'inherits default'}`);
  }

  // ── 2. Change the marketing sender only ──────────────────────────────────
  // Partial write: the other two send types are left untouched. Pass null to
  // put a type back to inheriting the workspace default.
  const updated = await tratto.workspace.update({
    timezone: 'Europe/Rome',
    senders: {
      marketing: {
        fromEmail: 'news@mail.acme.com',
        fromName: 'Acme Newsletter',
        replyTo: 'hello@acme.com',
      },
    },
  });
  console.log('\nTimezone now', updated.timezone);

  // ── 3. Notification preferences ──────────────────────────────────────────
  const prefs = await tratto.workspace.updatePreferences({
    locale: 'en',
    emailNotifications: { bounces: true, weeklyReport: false },
  });
  console.log('Preferences:', JSON.stringify(prefs.emailNotifications));

  // ── 4. Members ───────────────────────────────────────────────────────────
  // Members are invited and removed from the dashboard, by the workspace
  // owner. The API refuses `POST /v1/workspace/members/invite` and
  // `DELETE /v1/workspace/members/:userId` for every API key, so
  // `tratto.workspace.inviteMember()` and `tratto.workspace.removeMember()`
  // are deprecated: they cannot succeed.
  //
  // Changing a member's role still works. The userId is read in the
  // dashboard, where the members are listed:
  // const promoted = await tratto.workspace.updateMember('<userId>', { role: 'admin' });
  // console.log(`${promoted.email} is now ${promoted.role}`);

  // ── 5. Deleting the workspace ────────────────────────────────────────────
  // A workspace is deleted from the dashboard, by its owner. The API refuses
  // `DELETE /v1/workspace` for every API key, so `tratto.workspace.delete()`
  // is deprecated: it cannot succeed.
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
