# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-01

### Added (Phase 3 — Advanced tools + skills + release features)
- **Release tools**: `gitlab_release_list`, `gitlab_release_view`, `gitlab_release_create`
- **In-package skills**: populated `gitlab-assistant`, `gitlab-mr`, `gitlab-issue`, `gitlab-pipeline` with routing patterns and usage examples
- **README**: comprehensive install and usage documentation

## [0.2.0] - 2026-06-01

### Added (Phase 2 — Mutating tools + confirmation UX)
- **Mutating tools**: `gitlab_mr_create`, `gitlab_mr_merge`, `gitlab_issue_create`, `gitlab_issue_close`, `gitlab_pipeline_run`
- **Confirmation UX**: `lib/confirm.ts` with `dryRun` preview + `confirm` gate for all write operations
- **Safety**: DELETE in `gitlab_api` already gated; mutating tools follow same pattern

## [0.1.0] - 2026-06-01

### Added (Phase 1 — Read-only tools + diagnostics + wiring)
- **Tools**: `gitlab_project_resolve`, `gitlab_mr_list`, `gitlab_mr_view`, `gitlab_issue_list`, `gitlab_pipeline_status`, `gitlab_job_logs`, `gitlab_api`
- **Lib helpers**: `glab` runner, project cache, project fallback, project ID resolver, pagination, redaction, shared schemas
- **Config**: `src/config/{types,loader,guard}.ts` with `prime-settings.json` integration
- **Setup guard**: `requireSetup()` blocks all tools until `GITLAB_TOKEN` and config are valid
- **Command**: `/gitlab-doctor` — checks glab version, auth, API connectivity, config state
- **Events**: `resources_discover` exposes in-package `skills/` directory
- **Wiring**: `src/index.ts` registers all tools, commands, and events
- Package bootstrap, metadata, provenance, and placeholder skills structure
