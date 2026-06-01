# @gaodes/pi-gitlab

Pi extension package for GitLab workflows on self-hosted instances via `glab` CLI with in-package skills.

Optimized for `gitlab.elches.dev` (self-hosted GitLab behind a reverse proxy that decodes `%2F`). Works with `gitlab.com` and stock self-hosted instances via configuration overrides.

## Setup guard

On first load, the extension checks for:

1. **`GITLAB_TOKEN`** environment variable (or the env var named by `tokenEnv` in settings).
2. **`pi-gitlab`** key in `prime-settings.json`.

If either is missing, all tool calls are blocked and an interactive setup wizard guides you through:

- GitLab hostname (default: `gitlab.elches.dev`)
- Token env var name (default: `GITLAB_TOKEN`)
- SSH hostname (default: `gitlab-ssh.elches.dev`)
- SSH port (default: `2222`)

Settings are seeded into `~/.pi/agent/prime-settings.json` on completion. The extension only becomes usable after setup passes.

## Configuration

Settings key: **`pi-gitlab`** in `prime-settings.json`.

| Scope   | Path                              |
| ------- | --------------------------------- |
| Global  | `~/.pi/agent/prime-settings.json` |
| Project | `.pi/prime-settings.json`         |

Default global config (auto-seeded on first load):

```json
{
  "pi-gitlab": {
    "hostname": "gitlab.elches.dev",
    "sshHostname": "gitlab-ssh.elches.dev",
    "sshPort": 2222,
    "apiBase": "https://gitlab.elches.dev/api/v4",
    "tokenRef": null,
    "tokenEnv": "GITLAB_TOKEN",
    "defaultProjectId": null,
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
      "forcePushReprotectAlways": true,
      "minGlabVersion": "1.40.0"
    }
  }
}
```

Project-level settings override globals with a shallow merge.

## Requirements

- **`glab` CLI ≥ 1.40.0** — install from [GLab releases](https://gitlab.com/gitlab-org/cli/-/releases).
- **`GITLAB_TOKEN`** env var — typically loaded from `.env.1pass` at Pi session start.
- **Pi ≥ 0.74.0** (peer dependency).

## Phase 1 tools (v0.1.0 — read-only)

All tools accept an optional `project` parameter. When omitted, the tool resolves the project from the CWD's git remote, then from settings defaults.

| Tool                       | Purpose                                                              | Risk    |
| -------------------------- | -------------------------------------------------------------------- | ------- |
| `gitlab_project_resolve`   | Resolve project path → numeric ID. Cached in `~/.pi/agent/cache/pi-gitlab/projects.json`. | Read    |
| `gitlab_mr_list`           | List merge requests with filters (state, author, labels, branches). | Read    |
| `gitlab_mr_view`           | View MR metadata, discussions, optional diff.                        | Read    |
| `gitlab_issue_list`        | List issues with filters (state, labels, milestone, search).        | Read    |
| `gitlab_pipeline_status`   | Check pipeline status for branch, SHA, or pipeline ID.              | Read    |
| `gitlab_job_logs`          | Fetch CI job logs (secrets redacted by default).                     | Read    |
| `gitlab_api`               | Raw `glab api` passthrough. DELETE requires `confirm: true`. POST/PUT/PATCH show preview. | Variable |

## Phase 1 command

| Command           | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `/gitlab-doctor`  | Verify `glab` version, auth, host, token, proxy behavior, SSH remote, and settings state. |

## In-package skills

| Skill               | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `gitlab-assistant`   | Hub router — dispatches to sub-skills by intent.      |
| `gitlab-mr`          | Merge request workflows (read-only in Phase 1).       |
| `gitlab-issue`       | Issue triage and listing (read-only in Phase 1).      |
| `gitlab-pipeline`    | Pipeline diagnostics and CI troubleshooting.           |

Skills are registered via `resources_discover` and bundled with the package.

## Why an extension (not a skill)?

The local `gitlab.elches.dev` instance runs behind a reverse proxy that decodes `%2F` in URLs, breaking every path-encoded GitLab API call and most high-level `glab` commands. This extension centralizes the workaround — a **numeric project-ID resolver + atomic cache** — so neither users nor skill prose repeat it on every invocation.

The extension also provides typed I/O, default-on secret redaction for job logs, and a DELETE confirmation gate on the `gitlab_api` passthrough.

## Project resolution order

When a tool's `project` parameter is omitted:

1. Explicit `project` argument.
2. CWD git remote → parse SSH hostname + namespace/repo.
3. `defaultProjectPath` or `defaultProjectId` from settings.
4. Throw `ProjectRequiredError`.

## Token resolution order

1. `GITLAB_TOKEN` process env (loaded from `.env.1pass` by Pi).
2. Env var named by `tokenEnv` setting.
3. `tokenRef` (1Password reference) — only if explicitly configured and `op` CLI is available.

The package never writes tokens to disk.

## Roadmap

| Phase   | Version  | Scope                                                        |
| ------- | -------- | ------------------------------------------------------------ |
| Phase 1 | `0.1.0`  | Read-only tools + `/gitlab-doctor` + setup guard + skills.   |
| Phase 2 | `0.2.0`  | Mutating tools (create MR, merge, close issue) + confirmation UX. |
| Phase 3 | `0.3.0+` | Bulk ops, force-push-safe, webhooks, legacy skill archive.   |

## Install (local dev)

```bash
cd packages/pi-gitlab
npm install
```

## Standards

- Config surface: `prime-settings.json` key `pi-gitlab`.
- Skills registered via `pi.on("resources_discover", ...)`.
- Provenance tracked in `.upstream.json`.
- Changelog maintained in `CHANGELOG.md`.
- Published under `@gaodes` scope on npm.
- GitHub mirror: `github.com/gaodes/pi-gitlab`.

## Acknowledgements

Architecture informed by [gitlab-assistant-skills](https://github.com/grandcamel/gitlab-assistant-skills) (hub-and-spoke, CLI+API hybrid), [claude-glab-skill](https://github.com/henricook/claude-glab-skill) (progressive disclosure, troubleshooting references), and [wenerme/ai glab-cli](https://github.com/wenerme/ai/tree/main/skills/glab-cli) (pipeline polling pattern). See `.upstream.json` for the full inspiration list.
