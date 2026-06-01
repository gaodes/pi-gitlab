---
name: gitlab-issue
description: >
  GitLab issue triage and workflow support on gitlab.elches.dev. List and
  view issues with filters. Phase 1 is read-only; create, update, and
  close operations arrive in Phase 2.
---

# GitLab Issues

Manage issues on the local GitLab instance via Pi tools.

## Phase 1 scope (v0.1.0 — read-only)

### Available tools

| Tool                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `gitlab_issue_list`  | List issues with filters: `state`, `labels`, `milestone`, `author`, `assignee`, `confidential`, `search`, `maxRows`. |
| `gitlab_project_resolve` | Resolve project path to numeric ID (usually automatic via tool fallback). |

### Common workflows

**List open issues for the current project:**
```
gitlab_issue_list() → shows table of IID, Title, Author, State, Labels, Milestone
```

**Search issues by keyword:**
```
gitlab_issue_list({ search: "authentication error", state: "opened" })
```

**Filter by label and assignee:**
```
gitlab_issue_list({ labels: ["bug", "priority::high"], assignee: "username" })
```

### Deferred to Phase 2 (v0.2.0)

- `gitlab_issue_create` — create new issues
- `gitlab_issue_update` — update issue title, description, labels
- `gitlab_issue_close` — close issues
- `gitlab_issue_note` — add comments/notes to issues

Until Phase 2 lands, use `gitlab_api` with `method: "POST"` and `confirm: true` for one-off mutations.

## ⚠️ Local instance rules (gitlab.elches.dev)

> **Always use `glab api` with numeric project IDs.** Path-encoded URLs (`%2F`) fail with HTTP 400 due to the reverse proxy decoding the slashes before GitLab sees them.
>
> **High-level `glab` commands are non-functional** (`glab issue list`, `glab issue view`, etc.) — the SSH remote `gitlab-ssh.elches.dev` differs from the HTTPS host `gitlab.elches.dev`.
>
> Prefer Pi tools (`gitlab_issue_*`) — they resolve project IDs internally and use `glab api` correctly.
>
> If you must shell out directly: resolve the numeric ID first via `gitlab_project_resolve` or `glab api "projects?search=NAME"`.
