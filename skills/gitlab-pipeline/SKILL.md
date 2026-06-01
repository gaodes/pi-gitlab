---
name: gitlab-pipeline
description: >
  Pipeline diagnostics, status checks, and CI troubleshooting for GitLab.
  Use for checking pipeline status, fetching job logs, and triggering runs.
---

# GitLab Pipeline Skill

## Patterns

### Check latest pipeline status
```
gitlab_pipeline_status({ project: "namespace/project", ref: "main" })
```

### Fetch job logs
```
gitlab_job_logs({ project: "namespace/project", jobId: 456, tail: 100 })
```

### Trigger pipeline
```
gitlab_pipeline_run({
  project: "namespace/project",
  ref: "main",
  confirm: true
})
```

## Rules

- Check pipeline status before merging MRs.
- Use `tail` to limit log output; default is 200 lines.
- Logs are redacted by default for secrets.
- Triggering pipelines requires `confirm: true`.
