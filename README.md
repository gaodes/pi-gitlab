# @gaodes/pi-gitlab

Pi extension package for GitLab workflows using `glab` + in-package skills.

## Install

```bash
npm install @gaodes/pi-gitlab
```

Requires `glab >= 1.40.0` and a `PI_GITLAB_TOKEN` environment variable.

## Quick Start

1. Ensure `glab` is installed and authenticated:
   ```bash
   glab auth status
   ```

2. Set `PI_GITLAB_TOKEN` and add a `pi-gitlab` configuration key to `prime-settings.json` (global or project). The extension blocks tool usage until both exist.

3. Run diagnostics:
   ```
   /gitlab-doctor
   ```

## Tools

### Read-only (Phase 1)

| Tool | Description |
|------|-------------|
| `gitlab_project_resolve` | Resolve project path → numeric ID (with cache) |
| `gitlab_mr_list` | List MRs with filters and pagination |
| `gitlab_mr_view` | View MR details, discussions, diff |
| `gitlab_issue_list` | List issues with filters |
| `gitlab_pipeline_status` | Check pipeline status for a ref |
| `gitlab_job_logs` | Fetch CI job logs (redacted by default) |
| `gitlab_api` | Raw glab API passthrough. Mutating methods require `confirm:true`; without confirmation, returns preview-only result and does not execute |

### Mutating (Phase 2 — require `confirm:true`)

| Tool | Description |
|------|-------------|
| `gitlab_mr_create` | Create a merge request (title, description, draft, source/target branch) |
| `gitlab_mr_merge` | Merge an open merge request |
| `gitlab_issue_create` | Create an issue (title, description, labels, assignee, milestone) |
| `gitlab_issue_close` | Close an issue or mark it as resolved |
| `gitlab_pipeline_run` | Trigger a pipeline for a branch or tag |

All mutating tools require `confirm: true` to execute. Set `confirm: false, dryRun: true` to preview the operation without executing it.

### Advanced (Phase 3)

| Tool | Description |
|------|-------------|
| `gitlab_release_list` | List releases for a project |
| `gitlab_release_view` | View details of a single release |
| `gitlab_release_create` | Create a release (confirm-gated mutating operation) |
| `gitlab_mr_bulk_approve` | Approve multiple MRs matching a label/milestone filter (confirm-gated) |
| `gitlab_force_push_safe` | Force-push with branch protection re-enable and confirmation gate |

## Setup guard

On load, the extension checks for:

1. `PI_GITLAB_TOKEN` environment variable (or the env var named by `tokenEnv` in settings).
2. `pi-gitlab` configuration in `prime-settings.json` (global or project).

If either is missing, all tool calls are blocked. Run `/gitlab-doctor` to launch the interactive setup wizard, save the `pi-gitlab` config key, and verify readiness.

## Commands

- `/gitlab-doctor` — Run diagnostics for glab, auth, API, and config

## Skills

The package ships six in-package skills under `skills/`:

- `gitlab-assistant` — Hub router for GitLab operations
- `gitlab-mr` — MR lifecycle patterns (view, list, create, merge)
- `gitlab-issue` — Issue triage patterns (list, create, close)
- `gitlab-pipeline` — Pipeline diagnostics patterns (status, logs, run)
- `gitlab-release` — Release listing, viewing, and creation via `gitlab_api`
- `gitlab-workflow` — Cross-domain orchestration: release cuts, hotfixes, issue-to-MR flows

## Deprecation

This package supersedes the legacy `glab-gitlab` skill. That skill is marked deprecated in Phase 3 and remains as a read-only fallback reference. New GitLab automation should use `@gaodes/pi-gitlab` exclusively.

## Configuration

Key: `pi-gitlab` in `~/.pi/agent/prime-settings.json`

```json
{
  "pi-gitlab": {
    "hostname": "gitlab.example.com",
    "sshHostname": "gitlab-ssh.example.com",
    "sshPort": 22,
    "tokenEnv": "PI_GITLAB_TOKEN",
    "defaultProjectPath": null,
    "render": {
      "tableMaxRows": 25,
      "diffMaxLines": 400,
      "logTailLines": 200
    },
    "safety": {
      "requireConfirmForDelete": true,
      "previewMutatingApiCalls": true,
      "redactJobLogsByDefault": true,
      "minGlabVersion": "1.40.0"
    }
  }
}
```

## Project Resolution

The `project` parameter is optional on all tools. Resolution order:
1. Explicit parameter
2. Git remote `origin` in CWD
3. `defaultProjectPath` from settings

Resolved IDs are cached in `~/.pi/agent/cache/pi-gitlab/projects.json`.



---
[GitNexus] 1 related symbols found:

README.md (README.md)
