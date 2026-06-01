---
name: gitlab-mr
description: >
  Merge request lifecycle on gitlab.elches.dev — list, view, review, and
  checkout. Use when the user mentions MR, merge request, pull request,
  review, or draft. Phase 1 is read-only; create, approve, and merge
  operations arrive in Phase 2.
---

# GitLab Merge Requests

Manage merge requests on the local GitLab instance via Pi tools.

## Phase 1 scope (v0.1.0 — read-only)

### Available tools

| Tool                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `gitlab_mr_list`     | List MRs with filters: `state`, `author`, `assignee`, `reviewer`, `labels`, `targetBranch`, `sourceBranch`, `maxRows`. |
| `gitlab_mr_view`     | View a single MR with metadata, pipeline status, discussions, and optional diff. Params: `mrId` (required), `includeDiff`, `includeDiscussions`. |
| `gitlab_project_resolve` | Resolve project path to numeric ID (usually automatic via tool fallback). |

### Common workflows

**List open MRs for the current project:**
```
gitlab_mr_list() → shows table of IID, Title, Author, State, Pipeline, Target
```

**Filter MRs by author and label:**
```
gitlab_mr_list({ author: "username", labels: ["ready-for-review"] })
```

**View a specific MR with diff and discussions:**
```
gitlab_mr_view({ mrId: 42, includeDiff: true, includeDiscussions: true })
```

### Deferred to Phase 2 (v0.2.0)

- `gitlab_mr_create` — create new merge requests
- `gitlab_mr_approve` — approve MRs
- `gitlab_mr_merge` — merge MRs
- `gitlab_mr_rebase` — rebase MR source branches
- `gitlab_mr_checkout` — checkout MR branch locally

Until Phase 2 lands, use `gitlab_api` with `method: "POST"` and `confirm: true` for one-off mutations.

## ⚠️ Local instance rules (gitlab.elches.dev)

> **Always use `glab api` with numeric project IDs.** Path-encoded URLs (`%2F`) fail with HTTP 400 due to the reverse proxy decoding the slashes before GitLab sees them.
>
> **High-level `glab` commands are non-functional** (`glab mr list`, `glab mr view`, etc.) — the SSH remote `gitlab-ssh.elches.dev` differs from the HTTPS host `gitlab.elches.dev`.
>
> Prefer Pi tools (`gitlab_mr_*`) — they resolve project IDs internally and use `glab api` correctly.
>
> If you must shell out directly: resolve the numeric ID first via `gitlab_project_resolve` or `glab api "projects?search=NAME"`.
