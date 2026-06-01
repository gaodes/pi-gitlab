---
name: gitlab-ci
description: >
  GitLab CI/CD pipeline and job operations. Use for viewing pipeline
  status, running pipelines, retrying jobs, tracing logs, downloading
  artifacts, and linting CI configuration.
---

# GitLab CI/CD Skill

## Patterns

### Check pipeline status
```
gitlab_pipeline_status({ project: "namespace/project", ref: "main" })
```

### View CI status (current branch)
```bash
glab ci status
```

### View pipeline details
```bash
glab ci view
```

### List pipelines
```bash
glab ci list
```

### Run a pipeline
```
gitlab_pipeline_run({ project: "namespace/project", ref: "main", confirm: true })
```

### Retry a failed job
```bash
glab ci retry <job-id>
```

### Trace job logs
```
gitlab_job_logs({ project: "namespace/project", jobId: 123, tail: 100 })
```

### Download artifacts
```bash
glab ci artifact -b <branch> -j <job-name>
```

### Lint CI configuration
```
gitlab_ci_lint({ project: "namespace/project" })
```

### Delete a pipeline
```bash
glab ci delete <pipeline-id>
```

## Rules

- All mutating operations require `confirm: true`.
- Use `gitlab_pipeline_status` for structured pipeline info; use `glab ci status` for quick terminal view.
- Use `gitlab_job_logs` for structured log fetching with redaction.
- CI lint validates `.gitlab-ci.yml` without running a pipeline.
- For CI/CD variables, use the `gitlab-variable` skill instead.
