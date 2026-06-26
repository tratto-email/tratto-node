/**
 * Example: Create a template, build an audience, launch a campaign.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/campaign.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Create an email template ───────────────────────────────────────────
  const tpl = await tratto.templates.create({
    name: 'June Newsletter',
    html: [
      '<h1>Our June Update</h1>',
      '<p>Hello {{firstName}},</p>',
      "<p>Here's what's new this month...</p>",
    ].join(''),
  });
  console.log('Template created:', tpl.id, '(version', tpl.version, ')');

  // ── 2. Create a dynamic audience ─────────────────────────────────────────
  const { id: audienceId } = await tratto.audiences.create({
    name: 'Newsletter subscribers',
    rules: [{ field: 'status', operator: 'equals', value: 'subscribed' }],
  });
  console.log('Audience created:', audienceId);

  // ── 3. Create the campaign ────────────────────────────────────────────────
  const { id: campaignId } = await tratto.campaigns.create({
    name: 'June Newsletter 2025',
    templateId: tpl.id,
    audienceId,
    fromName: 'Acme Newsletter',
    fromEmail: 'news@mail.acme.com',
    subjectA: 'Our June update is here',
    subjectB: "Don't miss our June roundup", // A/B test subject
  });
  console.log('Campaign created:', campaignId);

  // ── 4. Send a test email before going live ────────────────────────────────
  const { emailId } = await tratto.campaigns.testSend(campaignId, 'team@acme.com');
  console.log('Test email sent:', emailId);

  // ── 5. Schedule the campaign for next Monday at 9 AM UTC ─────────────────
  const nextMonday = new Date();
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setUTCHours(9, 0, 0, 0);

  const { status } = await tratto.campaigns.send(campaignId, { scheduledAt: nextMonday });
  console.log('Campaign status:', status, '(scheduled for', nextMonday.toISOString(), ')');

  // ── 6. Print delivery stats ───────────────────────────────────────────────
  const stats = await tratto.campaigns.getStats(campaignId);
  console.log('\nDelivery stats:');
  console.log('  Total:        ', stats.stats.total);
  console.log('  Delivery rate:', stats.rates.deliveryRate.toFixed(1) + '%');
  console.log('  Open rate:    ', stats.rates.openRate.toFixed(1) + '%');
  console.log('  Click rate:   ', stats.rates.clickRate.toFixed(1) + '%');
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
