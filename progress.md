# Progress — @gaodes/pi-gitlab

## Status
Phases 1–3 complete ✅ | v0.3.0 | All tests passing | TypeScript clean

---

## Phase 1 — Read-only tools + diagnostics + wiring (v0.1.0)
- [x] `src/tools/gitlab_project_resolve.ts` — resolve + cache project ID
- [x] `src/tools/gitlab_mr_list.ts` — filtered MR list with markdown table
- [x] `src/tools/gitlab_mr_view.ts` — MR metadata, discussions, optional diff
- [x] `src/tools/gitlab_issue_list.ts` — filtered issue list with markdown table
- [x] `src/tools/gitlab_pipeline_status.ts` — pipeline + optional job status
- [x] `src/tools/gitlab_job_logs.ts` — tail + redaction of CI job trace
- [x] `src/tools/gitlab_api.ts` — raw passthrough with `:project` substitution; DELETE gated
- [x] `src/lib/glab.ts` — glab CLI wrapper with JSON parsing and error handling
- [x] `src/lib/projectCache.ts` — atomic read/write cache at `~/.pi/agent/cache/pi-gitlab/projects.json`
- [x] `src/lib/gitRemoteParse.ts` — parse git remote URL to namespace/path
- [x] `src/lib/projectFallback.ts` — resolve project from arg → git remote → settings default
- [x] `src/lib/resolveProjectId.ts` — path → numeric ID via cache + paginated glab search
- [x] `src/lib/pagination.ts` — client-side row limiting
- [x] `src/lib/redact.ts` — regex-based secret redaction for job logs
- [x] `src/lib/schemas.ts` — shared TypeBox parameter schemas
- [x] `src/config/{types,loader,guard}.ts` — `prime-settings.json` integration with setup guard
- [x] `src/commands/gitlab-doctor.ts` — `/gitlab-doctor`: glab version, auth, API, config checks
- [x] `src/events/resourcesDiscover.ts` — exposes `skills/` from package root
- [x] `src/index.ts` — registers all tools, commands, events, setup guard

## Phase 2 — Mutating tools + confirmation UX (v0.2.0)
- [x] `src/tools/gitlab_mr_create.ts` — create MR with `dryRun`/`confirm` gate
- [x] `src/tools/gitlab_mr_merge.ts` — merge MR with squash/remove-source-branch options
- [x] `src/tools/gitlab_issue_create.ts` — create issue with labels/assignee/milestone
- [x] `src/tools/gitlab_issue_close.ts` — close issue with confirmation
- [x] `src/tools/gitlab_pipeline_run.ts` — trigger pipeline with optional variables
- [x] `src/lib/confirm.ts` — reusable `dryRun` preview + `confirm` gate for all writes

## Phase 3 — Advanced tools + skills + docs (v0.3.0)
- [x] `src/tools/gitlab_release_list.ts` — list releases
- [x] `src/tools/gitlab_release_view.ts` — view release by tag
- [x] `src/tools/gitlab_release_create.ts` — create release from tag with confirmation
- [x] Skills populated: `gitlab-assistant`, `gitlab-mr`, `gitlab-issue`, `gitlab-pipeline`
- [x] `README.md` — comprehensive install, tools, commands, config documentation
- [x] `CHANGELOG.md` — Keep a Changelog format with Phase 1–3 entries
- [x] Tests: `gitRemoteParse`, `redact`, `confirm` (13 tests, all passing)

## Validation
| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | ✅ Clean |
| Tests (`vitest run`) | ✅ 13 passing |
| PrimeCodex standards | ✅ CHANGELOG, .upstream.json, .primecodex.json present |
| Ecosystem index | ✅ Registered in `ecosystem-index.yaml` |

## Remaining (Phase F — Release gates)
- [ ] Legacy `glab-gitlab` skill deprecation notice
- [ ] Final reviewer sign-off
- [ ] Publish gate review with El Che
- [ ] npm publish (ask first)
- [ ] GitHub mirror setup
