# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.2] - 2026-06-01

### Fixed
- Auto-derive apiBase from hostname in loadConfig and writeConfig when apiBase is not explicitly set

## [0.4.1] - 2026-06-01

### Changed
- Removed hardcoded personal GitLab instance hostname from `DEFAULT_CONFIG` — defaults are now empty strings, forcing users through setup wizard on first use
- Replaced personal instance references in skills and README with generic placeholder text
- Fixed lint warnings across codebase (unused imports, formatting)

## [0.4.0] - 2026-06-01

### Added (Phase 4 — 15 new skills + 3 new tools)

**New skills:**
- `gitlab-badge` — project badge management (list, create, update, delete, preview)
- `gitlab-ci` — CI/CD pipeline and job operations (status, run, retry, trace, lint, artifacts)
- `gitlab-container` — container registry management (repositories, tags, cleanup)
- `gitlab-discussion` — threaded discussion management on MRs and issues
- `gitlab-file` — repository file operations via API (read, blame, create, update, delete)
- `gitlab-group` — group management (list, create, members, subgroups, projects)
- `gitlab-label` — label management via CLI and API
- `gitlab-milestone` — milestone and sprint management via CLI and API
- `gitlab-protected-branch` — branch protection rule management
- `gitlab-repo` — repository/project operations (clone, fork, view, create, archive)
- `gitlab-search` — search across GitLab (projects, issues, MRs, code, commits, users, wiki)
- `gitlab-variable` — CI/CD variable management via CLI and API
- `gitlab-vulnerability` — security vulnerability management (list, confirm, dismiss, resolve)
- `gitlab-webhook` — webhook management (list, create, update, delete, test)
- `gitlab-wiki` — wiki page management (list, read, create, update, delete, attachments)

**New tools:**
- `gitlab_search_query` — structured search across GitLab globally, within a group, or project
- `gitlab_ci_lint` — validate `.gitlab-ci.yml` configuration via CI lint API
- `gitlab_repo_view` — view detailed project/repository info with stats

### Changed
- Updated `index.ts` header docstring to include Phase 4 tools and skills

## [0.3.0] - 2026-06-01

### Added (Phase 3 — Advanced tools + hardening + deprecation)
- **Release tools**: `gitlab_release_list`, `gitlab_release_view`, `gitlab_release_create` for full release management
- **Bulk operations**: `gitlab_mr_bulk_approve` — approve multiple MRs matching a label/milestone filter
- **Force-push safety**: `gitlab_force_push_safe` — force-push with branch protection re-enable and confirmation gate
- **Deprecation**: legacy `glab-gitlab` skill marked deprecated; `@gaodes/pi-gitlab` is now the canonical GitLab tool surface
- **README**: expanded with Phase 3 advanced tools table and deprecation section

### Changed
- All Phase 3 tools are confirm-gated following the same `requireConfirm` pattern as Phase 2
- Default token environment variable renamed from `GITLAB_TOKEN` to `PI_GITLAB_TOKEN` to avoid collisions with other tools. The `tokenEnv` setting still allows overriding to any custom env var.

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
