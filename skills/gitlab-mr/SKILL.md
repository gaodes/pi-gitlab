---
name: gitlab-mr
description: >
  Merge request lifecycle support for GitLab. Use for creating, listing,
  viewing, and merging MRs with confirmation UX.
---

# GitLab MR Skill

## Patterns

### List open MRs
```
gitlab_mr_list({ project: "namespace/project" })
```

### View MR details
```
gitlab_mr_view({ project: "namespace/project", mrId: 42 })
```

### Create MR
```
gitlab_mr_create({
  project: "namespace/project",
  sourceBranch: "feature/x",
  targetBranch: "main",
  title: "Add feature X",
  description: "## Summary\n...",
  confirm: true
})
```

### Merge MR
```
gitlab_mr_merge({
  project: "namespace/project",
  mrId: 42,
  squash: true,
  confirm: true
})
```

## Rules

- Always preview with `dryRun: true` before mutating.
- Require `confirm: true` for create and merge.
- Check pipeline status before merging.
- Never merge without user confirmation.
