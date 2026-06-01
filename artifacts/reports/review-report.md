# Phase 1 Completion Review — @gaodes/pi-gitlab

## Verdict

**FAIL** — Phase 1 is close, but there are critical blockers against the approved plan.

Validated:
- `npm run typecheck` — **pass**
- `npm test` — **pass**
- LSP diagnostics for `src/` — **pass**
- `npm pack --dry-run --json` — **fail for Phase 1 scope**: package includes untracked Phase 2 mutating tool files
- `/gitlab-doctor` API probe endpoint — **fail**: current endpoint returns HTTP 404; correct endpoint succeeds

## Critical Issues

### 1. Setup guard is not a hard block as approved

Evidence:
- `src/index.ts:31-33` calls `ensureConfig()` during extension load, which silently creates the `pi-gitlab` settings key before any tool guard runs.
- `src/lib/errors.ts:122-123` uses `isConfigured()`, and `src/lib/env.ts:25-29` defines that as token-only. It does **not** verify that an explicit valid `pi-gitlab` config exists.
- `README.md:14` promises an interactive setup wizard, but no wizard implementation is wired.

Why this blocks Phase 1:
- Approved decision: tools must hard-block until both `GITLAB_TOKEN` and `pi-gitlab` config are valid.
- Current behavior can pass with only a token because config is auto-seeded at load time.

Exact fixes needed:
- `src/index.ts`: remove the unconditional `ensureConfig()` call from extension load, or move seeding behind an explicit setup/doctor flow.
- `src/lib/errors.ts`: change `requireSetup()` to call `checkSetup(cwd)` and require `status.ready === true`, not only `isConfigured()`.
- All tool files under `src/tools/*.ts`: call `requireSetup(ctx.cwd)` so project-level `.pi/prime-settings.json` can participate in the guard.
- Implement the promised setup wizard or remove the wizard claim. If keeping the approved plan, add the wizard flow in `src/commands/gitlab-doctor.ts` or a dedicated setup command and seed settings only after user confirmation.

### 2. `gitlab_api` executes POST/PUT/PATCH without confirmation

Evidence:
- `src/tools/gitlab_api.ts:44-48` says only DELETE requires explicit confirmation.
- `src/tools/gitlab_api.ts:68-80` blocks only DELETE when `confirm !== true`.
- `src/tools/gitlab_api.ts:110-125` builds and executes the `glab api` command for POST/PUT/PATCH immediately.
- Preview text is generated only after execution at `src/tools/gitlab_api.ts:127-132`.

Why this blocks Phase 1:
- Approved scope: no Phase 1 mutating tools except guarded passthrough.
- Current POST/PUT/PATCH behavior is not guarded; it mutates first and previews after.

Exact fixes needed:
- `src/tools/gitlab_api.ts`: require `confirm: true` for **all** mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) before executing `glab`.
- `src/tools/gitlab_api.ts`: when `confirm` is missing, return a preview-only result with `{ success: false, error: "confirmation_required" }` and do not call `glab()`.
- `README.md` and `skills/gitlab-assistant/SKILL.md`: update the `gitlab_api` description to say all mutating verbs require `confirm: true`.

### 3. Phase 2 mutating files are present in the Phase 1 package artifact

Evidence:
- `git status --short` shows untracked Phase 2 files:
  - `src/lib/confirm.ts`
  - `src/tools/gitlab_issue_close.ts`
  - `src/tools/gitlab_issue_create.ts`
  - `src/tools/gitlab_mr_create.ts`
  - `src/tools/gitlab_mr_merge.ts`
  - `src/tools/gitlab_pipeline_run.ts`
- `npm pack --dry-run --json` includes those files because `package.json` packages the whole `src` directory.

Why this blocks Phase 1:
- Phase 1 must remain read-only except guarded `gitlab_api` passthrough.
- Even if not wired in `src/index.ts`, these mutating tools would ship in the v0.1.0 tarball.

Exact fixes needed:
- Remove or move the Phase 2 files out of the Phase 1 working tree before Phase 1 review/release.
- Alternatively, change `package.json.files` to whitelist only Phase 1 files, but the cleaner fix is to keep Phase 2 work on a separate branch/worktree until Phase 1 is accepted.
- Re-run `npm pack --dry-run --json` and verify the tarball contains no `gitlab_*_create`, `gitlab_*_merge`, `gitlab_*_close`, or `gitlab_pipeline_run` files.

### 4. `/gitlab-doctor` API connectivity check uses the wrong `glab api` endpoint

Evidence:
- `src/commands/gitlab-doctor.ts:106-110` calls `glab api /api/v4/version --hostname <host>`.
- Verified locally:
  - `glab api /api/v4/version --hostname gitlab.elches.dev` returns HTTP 404.
  - `glab api version --hostname gitlab.elches.dev` returns version JSON successfully.

Why this blocks Phase 1:
- `/gitlab-doctor` is required in Phase 1 and will falsely report API failure on the configured host.

Exact fixes needed:
- `src/commands/gitlab-doctor.ts`: change the API probe argument from `"/api/v4/version"` to `"version"` (or `"/version"` if verified with `glab`).
- Add a unit test for the doctor command's API probe arguments so `/api/v4/` is not duplicated again.
