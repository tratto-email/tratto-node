# Changelog

## Unreleased

- README and npm metadata: the intro says what Tratto is (an EU-hosted email
  API), that it is in private beta and how to request an invite; `keywords`
  added and `description` updated so the package shows up in npm search. No
  code change.
- `workspace.inviteMember()` and `workspace.removeMember()` are deprecated. The
  API refuses `POST /v1/workspace/members/invite` and
  `DELETE /v1/workspace/members/:userId` for every API key (403), so the
  methods could never succeed: members are invited and removed from the
  dashboard, by the workspace owner. They will be removed in the next major
  version. `workspace.updateMember()` is unchanged.

## 1.3.0

- `workspace.delete()` is deprecated. The API refuses `DELETE /v1/workspace`
  for every API key (403), so the method could never succeed: a workspace is
  deleted from the dashboard, by its owner. It will be removed in the next
  major version.

## 1.2.0

- `campaigns.unschedule(id)` cancels a pending schedule and puts the campaign
  back in `draft`. The route has answered three different 409s since the API
  added the bounce-probe wave: one of them means part of the list has already
  received the email and cannot be un-sent, so read `message` before retrying.
  They share the same `code`, which is tracked in `tratto-email/tratto-api#605`.
- `Campaign` gains `pausedReason` (`CampaignPausedReason | null`): how a client
  finds out why a campaign stopped on its own. `'bounce_rate'` is new — the
  campaign's own list produced too many permanent bounces and the send was
  halted. The field is always present on `GET /v1/campaigns` and
  `GET /v1/campaigns/{id}`; it is **not** returned by the stats route, so
  `CampaignStatsDetail` does not carry it.
- `Workspace` gains the per-send-type senders (`marketing`, `automation`,
  `transactional`): each is either `null`, meaning it inherits the
  workspace-wide default, or carries its own `fromEmail`/`fromName`/`replyTo`.
- The examples in `examples/` are now type-checked and linted with the rest of
  the package, so one that calls a renamed method breaks the build instead of
  rotting unnoticed. They cover all 55 public methods. `examples/smoke.ts` runs
  a real round trip against `api-staging` from an `.env`: it refuses a live key,
  sends to a simulator address, and cleans up after itself.

## 1.1.1

- The `User-Agent` header now reports the real package version
  (`@tratto/email/1.1.1`). It was hardcoded to `0.1.0` since the first
  release; it is read from `package.json` at build time from now on.
- `AnalyticsPeriod` gains `'180d'` and `'1y'`, which the API already accepts
  (`analytics.getSummary`, `analytics.getTimeseries`). They read the
  long-term aggregate, which holds live data only, so the API rejects them for
  test-mode keys.
- `Campaign` gains the optional `source` and `renderWarnings` fields that
  `campaigns.get()` returns for emailmd campaigns (`list()` omits both).
- Docs: README no longer lists the `ApiKey`/`ApiKeyCreated` types removed in
  1.0.0, documents `Template.renderWarnings` and the full list of analytics
  periods; CONTRIBUTING reflects the real `src/resources/` layout, the CI job
  graph and the npm-only release flow. The stray `pnpm-lock.yaml` is gone —
  `package-lock.json` is the only lockfile.

## 1.1.0

- `markdown` on `emails.send()`, `templates.create()` and
  `templates.update()`: write the email in [emailmd](https://www.emailmd.dev/)
  and let the API render it. `markdown` and `html` are mutually exclusive;
  validation stays server-side and the SDK passes the body through verbatim.
  `templates.create({ markdown })` sends `format: 'emailmd'` along with it,
  as the API requires.
- `Template` gains `format` (`'html' | 'emailmd'`), `source` and
  `renderWarnings`.
- `Workspace` and `UpdateWorkspaceParams` gain `keepTrattoBranding` (paid-plan
  branding opt-in) plus the `defaultFromName`, `defaultFromEmail` and
  `customUnsubscribeUrl` fields that `GET`/`PATCH /v1/workspace` had been
  returning and accepting for a while (`customUnsubscribeUrl: null` clears it).

## 1.0.0

### Breaking

- **Removed `tratto.apiKeys`** (`create`, `list`, `revoke`) and the
  `ApiKey`, `ApiKeyCreated`, `ApiKeyEnv`, `CreateApiKeyParams` and
  `ListApiKeysParams` types.

  API keys are credentials, and issuing them belongs in the dashboard
  (**Settings → API keys**), where a human can see the raw value once and
  choose its permissions — not in application code holding a key that would
  need `api-keys:write` to mint more. Keeping the surface invited exactly the
  kind of key sprawl and over-scoping we ran into in production.

  If you are automating provisioning, call the REST endpoints directly:
  `POST`, `GET`, `PATCH` and `DELETE` on `/v1/api-keys`. They are documented at
  https://docs.tratto.email/en/docs/authentication and are not going away.

  Everything else is unchanged — this release removes a resource, it does not
  alter any other method.

## 0.1.0

- First published release: emails, contacts, audiences, campaigns, templates,
  webhooks, domains, analytics, flows and workspace.
