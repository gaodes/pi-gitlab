---
name: gitlab-assistant
description: >
  Entry point for all GitLab operations on the gitlab.elches.dev instance.
  Always use this skill first when the user mentions GitLab, merge requests,
  issues, pipelines, releases, glab, MRs, CI/CD, or repositories. Routes to
  specialized skills based on intent.
---

# GitLab Assistant — Hub Router

You are the **GitLab assistant hub**. Every time the user mentions GitLab-related work, this skill activates and dispatches to the correct sub-skill.

## When to activate

Trigger on any mention of:

- GitLab, `gitlab.elches.dev`
- Merge requests (MR), pull requests, code review
- Issues, epics, boards
- Pipelines, CI/CD, jobs, runners
- Releases, tags, environments
- `glab` CLI usage

## Routing table

| User intent                               | Route to            | Notes                                          |
| ----------------------------------------- | ------------------- | ---------------------------------------------- |
| MR list, view, review, checkout           | `gitlab-mr`         | Phase 1: read-only. Create/merge in Phase 2.   |
| Issue list, view, triage                  | `gitlab-issue`      | Phase 1: read-only. Create/close in Phase 2.   |
| Pipeline status, job logs, CI debugging   | `gitlab-pipeline`   | Full diagnostics available.                    |
| Release create, view, list                | *(Phase 2)*         | Deferred. Use `gitlab_api` passthrough for now. |
| Bulk operations, force-push, webhooks     | *(Phase 3)*         | Deferred.                                      |

## How to execute

**Prefer Pi tools** (`gitlab_*`) over raw `glab` commands. Tools resolve project IDs, handle the local reverse-proxy workaround, and return structured output.

Typical flow:

1. Identify the project from the conversation context or CWD.
2. Call `gitlab_project_resolve` if you need the numeric ID.
3. Call the specific `gitlab_*` tool for the operation.
4. Render the result for the user.

## ⚠️ Local instance rules (gitlab.elches.dev)

> **Always use `glab api` with numeric project IDs.** Path-encoded URLs (`%2F`) fail with HTTP 400 due to the reverse proxy decoding the slashes before GitLab sees them.
>
> **High-level `glab` commands are non-functional** (`glab mr list`, `glab repo view -R`, etc.) — the SSH remote `gitlab-ssh.elches.dev` differs from the HTTPS host `gitlab.elches.dev`.
>
> Prefer Pi tools (`gitlab_*`) — they resolve project IDs internally and use `glab api` correctly.
>
> If you must shell out directly: resolve the numeric ID first via `gitlab_project_resolve` or `glab api "projects?search=NAME"`.

## Phase 1 scope (v0.1.0)

This is a **read-only** release. Available tools:

| Tool                       | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `gitlab_project_resolve`   | Resolve project path → numeric ID (cached).       |
| `gitlab_mr_list`           | List merge requests with filters.                 |
| `gitlab_mr_view`           | View MR metadata, discussions, optional diff.     |
| `gitlab_issue_list`        | List issues with filters.                         |
| `gitlab_pipeline_status`   | Check pipeline + optional job-level status.       |
| `gitlab_job_logs`          | Fetch CI job logs (redacted by default).          |
| `gitlab_api`               | Raw `glab api` passthrough. DELETE gated.         |

Available command: `/gitlab-doctor` — verify `glab` version, auth, host, token, and proxy behavior.

Mutating operations (create MR, merge, close issue, retry pipeline) are **deferred to Phase 2 (v0.2.0)**.
