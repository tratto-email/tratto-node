# @tratto/email

Official Node.js SDK for the [Tratto](https://tratto.email) email platform.

[![npm](https://img.shields.io/npm/v/@tratto/email)](https://www.npmjs.com/package/@tratto/email)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Installation

```bash
npm install @tratto/email
# or
pnpm add @tratto/email
```

Requires **Node.js ≥ 18** (native `fetch` support).

---

## Quick start

```ts
import { Tratto } from '@tratto/email';

const tratto = new Tratto('tratto_live_...');

const { id } = await tratto.emails.send({
  from: 'Acme <hello@mail.acme.com>',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Thanks for signing up.</p>',
});

console.log('Sent email:', id);
```

---

## Setup

### Constructor

```ts
const tratto = new Tratto(apiKey, options?);
```

| Parameter | Type | Description |
|---|---|---|
| `apiKey` | `string` | Required. Obtain one at `https://app.tratto.email/settings/api-keys`. Supports both `tratto_live_…` and `tratto_test_…` keys. |
| `options.baseUrl` | `string` | Optional. Defaults to `https://api.tratto.email`. |

---

## API Reference

All methods return `Promise<T>`. Use `async/await` or `.then()`.

### Emails

```ts
const { emails } = tratto;
```

#### `emails.send(params, idempotencyKey?)`

Send a transactional email. At least one of `html`, `text`, or `templateId` is required.

```ts
// Plain HTML
const { id } = await tratto.emails.send({
  from: 'Acme <hello@mail.acme.com>',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Hello world</p>',
});

// With a template and idempotency key
const { id } = await tratto.emails.send(
  {
    from: 'hello@mail.acme.com',
    to: ['alice@example.com', 'bob@example.com'],
    subject: 'Reset your password',
    templateId: 'tpl_abc123',
    variables: { name: 'Alice', link: 'https://...' },
  },
  'unique-idempotency-key',
);
```

#### `emails.list(params?)`

```ts
const { data, pagination } = await tratto.emails.list({
  status: 'delivered',
  limit: 20,
});
```

#### `emails.get(id)`

```ts
const email = await tratto.emails.get('em_abc123');
console.log(email.events);
```

#### `emails.listEvents(id)`

```ts
const events = await tratto.emails.listEvents('em_abc123');
```

---

### Contacts

```ts
const { contacts } = tratto;
```

#### `contacts.create(params)`

```ts
const { id } = await tratto.contacts.create({
  email: 'alice@example.com',
  firstName: 'Alice',
  tags: ['vip'],
});
```

#### `contacts.list(params?)`

```ts
const { data } = await tratto.contacts.list({ status: 'subscribed', limit: 50 });
```

#### `contacts.update(id, params)`

```ts
await tratto.contacts.update('con_abc123', { status: 'unsubscribed' });
```

#### `contacts.importCsv(csvText)`

Bulk-import contacts from a CSV string (async job). Poll `getImportJob` to track progress.

```ts
const csv = `email,first_name,last_name
alice@example.com,Alice,Smith
bob@example.com,Bob,Jones`;

const { jobId } = await tratto.contacts.importCsv(csv);
const status = await tratto.contacts.getImportJob(jobId);
console.log(status.processedRows);
```

---

### Audiences

```ts
// Create a dynamic segment
const { id } = await tratto.audiences.create({
  name: 'Power users',
  rules: [{ field: 'tags', operator: 'array_contains', value: 'vip' }],
});

// List
const { data } = await tratto.audiences.list();

// Add contacts (up to 500 IDs per call)
const result = await tratto.audiences.addContacts('aud_abc123', ['con_1', 'con_2']);
console.log(result.added);
```

---

### Campaigns

```ts
// Create a draft
const { id } = await tratto.campaigns.create({
  name: 'June Newsletter',
  templateId: 'tpl_abc123',
  audienceId: 'aud_abc123',
  fromName: 'Acme',
  fromEmail: 'news@mail.acme.com',
  subjectA: 'Our June update',
});

// Send immediately
const { status } = await tratto.campaigns.send(id);

// Schedule for a future date
await tratto.campaigns.send(id, { scheduledAt: new Date('2025-07-01T09:00:00Z') });

// Delivery stats
const stats = await tratto.campaigns.getStats(id);
console.log(stats.rates.openRate);

// Pause
await tratto.campaigns.pause(id);

// Test send
const { emailId } = await tratto.campaigns.testSend(id, 'me@example.com');
```

---

### Templates

```ts
// Create
const tpl = await tratto.templates.create({ name: 'Welcome email', html: '<h1>Hi {{name}}!</h1>' });

// Update (auto-creates a new version)
await tratto.templates.update(tpl.id, { html: '<h1>Hello {{name}}!</h1>' });

// Version history
const versions = await tratto.templates.listVersions(tpl.id);
const v2 = await tratto.templates.getVersion(tpl.id, 2);

// Test send
await tratto.templates.testSend(tpl.id, 'me@example.com', { name: 'Alice' });

// Delete
await tratto.templates.delete(tpl.id);
```

---

### Webhooks

```ts
// Register — save the secret, it is shown only once
const { id, secret } = await tratto.webhooks.create({
  url: 'https://my-app.com/webhooks/tratto',
  events: ['delivered', 'bounced', 'complained'],
});

// List
const hooks = await tratto.webhooks.list();

// Delivery history
const { data } = await tratto.webhooks.listDeliveries(id, { limit: 20 });

// Test connectivity
await tratto.webhooks.test(id);

// Rotate signing secret
const { secret: newSecret } = await tratto.webhooks.rotateSecret(id);

// Delete
await tratto.webhooks.delete(id);
```

---

### Domains

```ts
// Add domain — response contains the DNS records to publish
const domain = await tratto.domains.add('mail.acme.com');
console.log('Publish these DNS records:', domain.records);

// Trigger SPF/DKIM/DMARC verification
const verified = await tratto.domains.verify(domain.id);
console.log(verified.status);

// List / get
const { data } = await tratto.domains.list();
const detail = await tratto.domains.get(domain.id);

// Delete
const { deletedAt } = await tratto.domains.delete(domain.id);
```

---

### API Keys

```ts
// Create — raw key is shown only once
const key = await tratto.apiKeys.create({
  name: 'CI deployment key',
  env: 'live',
  permissions: ['emails:send'],
});
console.log('Raw key (save this!):', key.key);

// List (prefix only, never raw token)
const { data } = await tratto.apiKeys.list();

// Revoke
const { revokedAt } = await tratto.apiKeys.revoke(key.id);
```

---

### Analytics

```ts
// Aggregated summary
const summary = await tratto.analytics.getSummary('30d');
console.log('Open rate:', summary.openRate);

// Daily timeseries
const points = await tratto.analytics.getTimeseries('7d');
```

Supported periods: `'7d'` | `'30d'` | `'90d'`. Results are cached server-side for 1 hour.

---

### Flows

```ts
// Create a draft flow
const { id } = await tratto.flows.create({ name: 'Welcome series' });

// Configure trigger and steps
await tratto.flows.update(id, {
  trigger: { type: 'contact_joins_audience', config: { audienceId: 'aud_abc123' } },
  steps: [
    { id: 'step_1', type: 'send_email', config: { templateId: 'tpl_abc123' } },
    { id: 'step_2', type: 'wait',       config: { delay: '3d' } },
    { id: 'step_3', type: 'send_email', config: { templateId: 'tpl_def456' } },
  ],
});

// Activate / deactivate
await tratto.flows.activate(id);
await tratto.flows.deactivate(id);

// Delete (draft or inactive only)
await tratto.flows.delete(id);
```

---

### Workspace

```ts
// Get current workspace
const ws = await tratto.workspace.get();
console.log(ws.name, ws.plan);

// Update settings
await tratto.workspace.update({ name: 'Acme Corp', timezone: 'Europe/Rome' });

// Preferences
await tratto.workspace.updatePreferences({
  locale: 'en',
  emailNotifications: { weeklyReport: true },
});

// Team management
await tratto.workspace.inviteMember({ email: 'dev@acme.com', role: 'admin' });
await tratto.workspace.updateMember('usr_abc123', { role: 'member' });
await tratto.workspace.removeMember('usr_abc123');
```

---

## Error handling

Failed HTTP requests throw a `TrattoError` with `code`, `statusCode`, and an optional `docs` URL.

```ts
import { Tratto, TrattoError } from '@tratto/email';

try {
  await tratto.emails.send({ from: '...', to: '...', subject: '...', html: '...' });
} catch (err) {
  if (err instanceof TrattoError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
    if (err.docs) console.error('Docs:', err.docs);
  } else {
    throw err;
  }
}
```

---

## TypeScript

Full type declarations are exported:

```ts
import type {
  SendEmailParams,
  EmailDetail,
  EmailEvent,
  PaginatedResponse,
  Contact,
  Audience,
  Campaign,
  CampaignStatsDetail,
  Template,
  Webhook,
  Domain,
  ApiKey,
  ApiKeyCreated,
  AnalyticsSummary,
  TimeseriesPoint,
  Flow,
  Workspace,
  WorkspaceMember,
} from '@tratto/email';
```

---

## Examples

See the [`examples/`](examples/) folder:

| File | Description |
|---|---|
| [`send-email.ts`](examples/send-email.ts) | Send transactional emails (HTML, template, with idempotency) |
| [`contacts.ts`](examples/contacts.ts) | Contact management and CSV bulk import |
| [`campaign.ts`](examples/campaign.ts) | Create, configure, and send a marketing campaign |
| [`analytics.ts`](examples/analytics.ts) | Fetch delivery metrics and daily timeseries |
| [`webhook.ts`](examples/webhook.ts) | Register a webhook and inspect delivery history |

Run any example with [tsx](https://github.com/privatenumber/tsx):

```bash
TRATTO_API_KEY=tratto_live_... npx tsx examples/send-email.ts
```

---

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
