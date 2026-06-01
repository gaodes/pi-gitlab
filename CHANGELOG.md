# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-01

### Added (Phase 3 — Advanced tools + hardening + deprecation)
- **Release tools**: `gitlab_release_list`, `gitlab_release_view`, `gitlab_release_create` for full release management
- **Bulk operations**: `gitlab_mr_bulk_approve` — approve multiple MRs matching a label/milestone filter
- **Force-push safety**: `gitlab_force_push_safe` — force-push with branch protection re-enable and confirmation gate
- **Deprecation**: legacy `glab-gitlab` skill marked deprecated; `@gaodes/pi-gitlab` is now the canonical GitLab tool surface
- **README**: expanded with Phase 3 advanced tools table and deprecation section

### Changed
- All Phase 3 tools are confirm-gated following the same `requireConfirm` pattern as Phase 2

## [0.2.0] - 2026-06-01

### Added (Phase 2 — Mutating tools + confirmation UX)
- **Mutating tools**: `gitlab_mr_create`, `gitlab_mr_merge`, `gitlab_issue_create`, `gitlab_issue_close`, `gitlab_pipeline_run`
- **Confirmation utility**: `src/lib/confirm.ts` — `requireConfirm()` gates all mutating operations with `confirm:true` execution and `dryRun:true` preview
- **Setup guard**: all Phase 2 tools call `requireSetup(ctx.cwd)` at execute time, blocking when token or config is missing
- **In-package skills**: `gitlab-release` (release list/view/create patterns) and `gitlab-workflow` (cross-domain orchestration)
- **Guard behavior tests**: `test/tools/guard-behavior.test.ts` covers setup-required error shape and confirm gate

## [0.1.0] - 2026-06-01

### Added (Phase 1 — Read-only tools + diagnostics + wiring)
- Tools: `gitlab_project_resolve`, `gitlab_mr_list`, `gitlab_mr_view`, `gitlab_issue_list`, `gitlab_pipeline_status`, `gitlab_job_logs`, `gitlab_api`
- Lib helpers: glab runner, project cache, fallback resolution, pagination, redaction, shared schemas
- Config integration under `pi-gitlab` in `prime-settings.json`
- Setup guard to block tools until token + explicit config are valid
- `/gitlab-doctor` diagnostics and interactive setup wizard
- `resources_discover` wiring for in-package skills
- Package bootstrap metadata and provenance files

### Changed
- `gitlab_api` now requires `confirm: true` for all mutating verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
- Phase-2/3 mutating and release tool files removed from Phase-1 artifact scope.
