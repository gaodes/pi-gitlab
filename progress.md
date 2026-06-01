# Progress — pi-gitlab

## Status
Phase 1C complete ✅

## Phase 1C — Wiring + Doctor + Resources Discover (this session)
- [x] `src/index.ts` — registers `/gitlab-doctor` command, 6 Phase 1 tools, `resources_discover` handler, setup guard
- [x] `src/commands/gitlab-doctor.ts` — `/gitlab-doctor` command: glab version, auth, API connectivity, config checks
- [x] `src/events/resourcesDiscover.ts` — exposes `skills/` from package root via `skillPaths`
- [x] `src/lib/errors.ts` — `SetupRequiredError`, `requireSetup()` guard, `setupRequiredResult()` — merged with pre-existing `GlabError`
- [x] `src/lib/env.ts` — re-exports from `config/loader` + adds `getApiHost()`, `getSshHost()`, `getSshPort()`, `isConfigured()`
- [x] `src/config/loader.ts` — added `ensureConfig()` auto-seed function (was missing from Phase 1A/1B)
- [x] Fixed pre-existing lint issues in `src/lib/redact.ts`, `src/lib/glab.ts`, `src/config/guard.ts`
- [x] Added `@earendil-works/pi-coding-agent` and `typebox` as devDependencies
- [x] `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅

## Tools Registered (Phase 1)
| Tool | Label | Description |
|------|-------|-------------|
| `gitlab_project_resolve` | Resolve GitLab Project | Project path → numeric ID |
| `gitlab_mr_list` | List GitLab MRs | List open MRs |
| `gitlab_mr_view` | View GitLab MR | MR details |
| `gitlab_issue_list` | List GitLab Issues | List issues |
| `gitlab_pipeline_status` | Pipeline Status | Latest pipeline |
| `gitlab_job_logs` | Job Logs | CI job trace |
| `gitlab_api` | GitLab API (raw) | Generic API wrapper |

## Commands Registered
| Command | Description |
|---------|-------------|
| `/gitlab-doctor` | Diagnostic check: glab, auth, API, config |

## Setup Guard
All tools call `requireSetup()` before execution. If `GITLAB_TOKEN` is unset and no token in `prime-settings.json`, returns `SetupRequiredError` with actionable message directing agent to `/gitlab-doctor`.

## Next Steps
- Phase 1D: Interactive setup wizard (`/gitlab-setup` command)
- Phase 2: Mutating tools (create MR, close issue, retry pipeline, etc.)
