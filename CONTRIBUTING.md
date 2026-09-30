# Contributing to `@tratto/email`

Thank you for your interest in contributing! This guide covers everything you need to get the project running locally, write a good change, and get it merged.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Running the checks](#running-the-checks)
- [Manual smoke test](#manual-smoke-test)
- [Submitting a pull request](#submitting-a-pull-request)
- [Commit style](#commit-style)
- [Release process](#release-process)

---

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be
respectful and constructive in issues, pull requests, and all other project
communication.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 10 (bundled with Node 18+) |

## Local setup

```bash
git clone https://github.com/tratto-email/tratto-node.git
cd tratto-node
npm ci
```

`npm ci` installs exact versions from `package-lock.json` and is the same command used in CI.

## Project structure

```
src/
  index.ts          # Public entry-point — re-exports client, error and types
  client.ts         # TrattoClient: wires the resources below
  error.ts          # TrattoError class
  types.ts          # All TypeScript type definitions
  resources/
    base.ts         # BaseResource: fetch, auth header, User-Agent, query builder
    analytics.ts  audiences.ts  campaigns.ts  contacts.ts  domains.ts
    emails.ts     flows.ts      templates.ts  webhooks.ts  workspace.ts
  **/*.spec.ts      # Vitest specs live next to the code they test
examples/           # Standalone snippets: type-checked and linted, never published
  send-email.ts  contacts.ts  audiences.ts  campaign.ts  templates.ts
  analytics.ts   webhook.ts   domains.ts    flows.ts     workspace.ts
  express.ts     fastify.ts   nextjs.ts
  smoke.ts       # the one runnable script, see "Manual smoke test" below
```

## Development workflow

```bash
# Build in watch mode during development
npm run dev

# Run a quick one-off build
npm run build
```

The build uses `tsup` to produce three outputs inside `dist/`:
- `index.js` — CommonJS bundle
- `index.mjs` — ES module bundle
- `index.d.ts` — TypeScript declarations

## Running the checks

All four checks must pass before a PR can be merged. Run them locally before pushing:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (no output emitted, just type errors)
npm test            # Vitest (run once)
npm run build       # tsup build (confirms the output compiles)
```

Watch mode for tests while developing:

```bash
npm run test:watch
```

`lint` and `typecheck` cover `examples/` as well as `src/`. The examples are
the only code in the repo written the way a customer writes it, so a renamed
method or a changed signature fails a check instead of reaching npm. They are
never part of the published package: `tsup` builds from `src/index.ts` and
`files` in `package.json` ships `dist/` only.

## Manual smoke test

Every test in `src/` stubs `fetch`, so the whole suite stays green even if the
API renames a field. `examples/smoke.ts` is the one thing that talks to a real
server: it creates a contact, creates a template, sends an email, reads the
status back, and cleans up after itself.

It is **not** in CI, on purpose: the org has a hard 3000 minute/month budget on
GitHub Actions. Run it by hand before publishing a release, the way the
dashboard E2E suite is run.

```bash
cp examples/.env.example examples/.env   # then fill in every variable
npx tsx --env-file=examples/.env examples/smoke.ts
```

`examples/.env` is gitignored. `.env.example` carries the variable names and
no values: a key never enters the repo.

- It refuses to start without a `tratto_test_…` key, and only ever sends to
  `delivered@simulator.tratto.email`. No real inbox is touched and the
  account's bounce rate does not move.
- A missing variable stops the run with the name of the variable. There is no
  silent skip.
- It does not touch flows: those are the only v1 resource with no granular
  scope, so they would need a key with the `*` permission. They stay in the
  compiled examples.
- Cleanup runs even when a step fails. The template is deleted; the contact is
  unsubscribed and reused by the next run, because v1 has no contact-delete
  route; the test email expires on its own after 7 days.

CI runs the same four checks as separate jobs: `lint`, `typecheck` and `test`
run in parallel; `build` starts only after `lint` and `typecheck` pass
(`needs: [lint, typecheck]`) and uploads `dist/` as a workflow artifact.

## Submitting a pull request

1. Fork the repository and create a feature branch from `main`.
2. Make your change — keep it focused; one concern per PR.
3. Add or update tests. Every new behaviour should have a corresponding test.
4. Run all checks locally (`lint`, `typecheck`, `test`, `build`).
5. Open a PR against `main`. Fill in the PR description with what changed and why.

### What to expect after opening a PR

- CI runs automatically. All four jobs must be green before merge.
- A maintainer will review and may request changes.
- Squash-merge is used, so your commit history inside the branch doesn't need to be perfectly clean.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

Examples:
```
feat(client): add flows.enroll() method
fix(error): preserve original stack trace in TrattoError
docs: update README with contacts.importCsv example
test(client): cover 429 rate-limit response
```

## Release process

Releases are handled by maintainers. Publishing is automated via the `publish.yml` workflow, which is triggered when a new version tag (`v*`) is pushed to `main`.

The version lives in three places, all updated in the same PR:
`package.json`, `package-lock.json` (the two root `version` fields) and
`CHANGELOG.md`. The `User-Agent` header is read from `package.json` at build
time — nothing to touch in `src/`.

To prepare a release (one PR against `main`):
1. Bump `version` in `package.json`, then refresh the lockfile so it carries
   the same version: `npm install --package-lock-only` (rewrites
   `package-lock.json` only, `node_modules` is untouched).
2. Add a `## <version>` section at the top of `CHANGELOG.md`.
3. Commit with `chore(release): v<version>`, open the PR, merge it.
4. Tag the merge commit: `git tag v<version> <sha> && git push origin v<version>`.

The tag push triggers `publish.yml`, which runs `npm ci`, `npm run build` and
`npm publish --provenance` through npm Trusted Publishing (OIDC). No GitHub
release and no npm token are involved. This package uses **npm** (not pnpm)
because that is the toolchain the publish workflow is registered with.
