# @tratto/email

Node.js SDK for [Tratto](https://tratto.email) — send transactional and marketing email.

## Installation

```bash
npm install @tratto/email
# or
pnpm add @tratto/email
```

## Usage

```typescript
import { Tratto } from '@tratto/email';

const tratto = new Tratto('tratto_live_...');

const email = await tratto.emails.send({
  from: 'you@yourdomain.com',
  to: 'user@example.com',
  subject: 'Hello from Tratto',
  html: '<p>This is a test email.</p>',
});

console.log(email.id);
```

## API

### `new Tratto(apiKey, options?)`

| Option | Type | Default |
|---|---|---|
| `apiKey` | `string` | — |
| `options.baseUrl` | `string` | `https://api.tratto.email` |

### `tratto.emails.send(options)`

Sends an email. Returns `SendEmailResponse`.

### `tratto.emails.list(options?)`

Lists emails with optional `status`, `limit`, `after` filters.

### `tratto.emails.get(id)`

Fetches a single email by ID.

## Documentation

Full docs at [tratto.email/docs](https://tratto.email/docs).

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
