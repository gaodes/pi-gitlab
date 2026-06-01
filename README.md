# @gaodes/pi-gitlab

Pi extension package for GitLab workflows on `gitlab.elches.dev` using `glab` + in-package skills.

## Install

```bash
npm install @gaodes/pi-gitlab
```

Requires `glab >= 1.40.0` and a `GITLAB_TOKEN` environment variable.

## Quick Start

1. Ensure `glab` is installed and authenticated:
   ```bash
   glab auth status
   ```

2. Set `GITLAB_TOKEN` and add a `pi-gitlab` configuration key to `prime-settings.json` (global or project). The extension blocks tool usage until both exist.

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

### Mutating / Advanced (deferred)

Mutating and advanced tools are deferred out of the Phase 1 package build to keep v0.1.0 strictly read-only with a guarded `gitlab_api` passthrough.

## Setup guard

On load, the extension checks for:

1. `GITLAB_TOKEN` environment variable (or the env var named by `tokenEnv` in settings).
2. `pi-gitlab` configuration in `prime-settings.json` (global or project).

If either is missing, all tool calls are blocked. Phase 1 intentionally removes unconditional auto-seeding from extension load; use `/gitlab-doctor` to seed defaults and then configure the missing pieces manually before tools become usable.

## Commands

- `/gitlab-doctor` — Run diagnostics for glab, auth, API, and config

## Skills

The package ships four in-package skills under `skills/`:

- `gitlab-assistant` — Hub router for GitLab operations
- `gitlab-mr` — MR lifecycle patterns
- `gitlab-issue` — Issue triage patterns
- `gitlab-pipeline` — Pipeline diagnostics patterns

## Configuration

Key: `pi-gitlab` in `~/.pi/agent/prime-settings.json`

```json
{
  "pi-gitlab": {
    "hostname": "gitlab.elches.dev",
    "sshHostname": "gitlab-ssh.elches.dev",
    "sshPort": 2222,
    "tokenEnv": "GITLAB_TOKEN",
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
