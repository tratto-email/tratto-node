# Changelog

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
