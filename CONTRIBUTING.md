# Contributing to `@tratto/email`

Thank you for your interest in contributing! This guide covers everything you need to get the project running locally, write a good change, and get it merged.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Running the checks](#running-the-checks)
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
  index.ts        # Public entry-point — re-exports everything
  client.ts       # TrattoClient class and all resource objects
  error.ts        # TrattoError class
  types.ts        # All TypeScript type definitions
examples/
  node-script/    # Runnable example showing basic SDK usage
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

CI runs these four checks in the order: `lint → typecheck → test → build`. The `build` job only runs once all three earlier jobs pass.

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

To prepare a release:
1. Update `version` in `package.json`.
2. Commit with `chore(release): v<version>`.
3. Tag: `git tag v<version> && git push --tags`.

The workflow then runs `npm publish` automatically.
