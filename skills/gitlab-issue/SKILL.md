---
name: gitlab-issue
description: >
  GitLab issue triage and workflow support. Use for creating, listing,
  viewing, and closing issues.
---

# GitLab Issue Skill

## Patterns

### List open issues
```
gitlab_issue_list({ project: "namespace/project" })
```

### Create issue
```
gitlab_issue_create({
  project: "namespace/project",
  title: "Bug: ...",
  description: "## Steps to reproduce\n...",
  labels: ["bug", "urgent"],
  confirm: true
})
```

### Close issue
```
gitlab_issue_close({
  project: "namespace/project",
  issueId: 123,
  confirm: true
})
```

## Rules

- Always preview with `dryRun: true` before creating or closing.
- Require `confirm: true` for create and close.
- Use labels consistently with project conventions.
