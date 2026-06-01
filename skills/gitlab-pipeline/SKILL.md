---
name: gitlab-pipeline
description: >
  Pipeline diagnostics, status checks, and CI troubleshooting for GitLab
  on gitlab.elches.dev. Check pipeline health, view job statuses, and
  fetch redacted job logs. Phase 1 is read-only; retry, cancel, and run
  operations arrive in Phase 2.
---

# GitLab Pipelines & CI

Diagnose and monitor CI/CD pipelines on the local GitLab instance via Pi tools.

## Phase 1 scope (v0.1.0 — read-only)

### Available tools

| Tool                       | What it does                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| `gitlab_pipeline_status`   | Check pipeline status for a branch, commit SHA, or pipeline ID. Optional `includeJobs` for job-level detail. |
| `gitlab_job_logs`          | Fetch CI job log output. **Redacts secrets by default** (token values, Bearer headers, passwords, AWS keys). Params: `jobId` (required), `tail` (default 200 lines), `redact` (default true). |
| `gitlab_project_resolve`   | Resolve project path to numeric ID (usually automatic via tool fallback).    |

### Common workflows

**Check latest pipeline for current branch:**
```
gitlab_pipeline_status({ ref: "main" })
```

**Get pipeline status with per-job breakdown:**
```
gitlab_pipeline_status({ pipelineId: 12345, includeJobs: true })
```

**Fetch job logs (redacted):**
```
gitlab_job_logs({ jobId: 67890, tail: 200 })
```

**Fetch raw logs for debugging (secrets visible — use carefully):**
```
gitlab_job_logs({ jobId: 67890, redact: false })
```

### Polling pattern

For "wait until pipeline finishes" workflows, poll `gitlab_pipeline_status` at intervals:

1. Call `gitlab_pipeline_status({ ref: "<branch>" })`.
2. If status is `running` or `pending`, wait and re-check.
3. Stop when status reaches `success`, `failed`, `canceled`, or `skipped`.

### Deferred to Phase 2 (v0.2.0)

- `gitlab_pipeline_retry` — retry failed pipelines
- `gitlab_pipeline_cancel` — cancel running pipelines
- `gitlab_pipeline_run` — trigger manual pipelines

Until Phase 2 lands, use `gitlab_api` with `confirm: true` for one-off mutations.

## ⚠️ Local instance rules (gitlab.elches.dev)

> **Always use `glab api` with numeric project IDs.** Path-encoded URLs (`%2F`) fail with HTTP 400 due to the reverse proxy decoding the slashes before GitLab sees them.
>
> **High-level `glab` commands are non-functional** (`glab pipeline status`, `glab ci trace`, etc.) — the SSH remote `gitlab-ssh.elches.dev` differs from the HTTPS host `gitlab.elches.dev`.
>
> Prefer Pi tools (`gitlab_pipeline_*`, `gitlab_job_*`) — they resolve project IDs internally and use `glab api` correctly.
>
> If you must shell out directly: resolve the numeric ID first via `gitlab_project_resolve` or `glab api "projects?search=NAME"`.
