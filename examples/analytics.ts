/**
 * Example: Fetch delivery metrics and daily timeseries data.
 *
 * Run:
 *   TRATTO_API_KEY=tratto_live_... npx tsx examples/analytics.ts
 */
import { Tratto, TrattoError } from '../src/index';

const apiKey = process.env['TRATTO_API_KEY'];
if (!apiKey) throw new Error('Set the TRATTO_API_KEY environment variable');

const tratto = new Tratto(apiKey);

async function main() {
  // ── 1. Aggregated summary ─────────────────────────────────────────────────
  const summary = await tratto.analytics.getSummary('30d');

  console.log('\n📊 Last 30 days');
  console.log(`  Total sent:    ${summary.totalSent}`);
  console.log(`  Delivered:     ${summary.delivered} (${summary.deliveryRate.toFixed(1)}%)`);
  console.log(`  Opened:        ${summary.opened} (${summary.openRate.toFixed(1)}%)`);
  console.log(`  Clicked:       ${summary.clicked} (${summary.clickRate.toFixed(1)}%)`);
  console.log(`  Bounced:       ${summary.bounced} (${summary.bounceRate.toFixed(1)}%)`);
  console.log(`  Complained:    ${summary.complained}`);

  // ── 2. Daily timeseries ───────────────────────────────────────────────────
  const points = await tratto.analytics.getTimeseries('7d');

  console.log('\n📅 Daily breakdown (last 7 days):');
  console.log('  Date         Sent  Delivered  Opened  Bounced');
  for (const p of points) {
    console.log(
      `  ${p.date}  ${String(p.sent).padStart(4)}  ${String(p.delivered).padStart(9)}  ${String(p.opened).padStart(6)}  ${String(p.bounced).padStart(7)}`,
    );
  }

  // ── 3. 90-day comparison ──────────────────────────────────────────────────
  const q = await tratto.analytics.getSummary('90d');
  console.log(`\n📈 90-day open rate: ${q.openRate.toFixed(1)}%`);
}

main().catch(err => {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
