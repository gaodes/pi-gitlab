---
name: gitlab-protected-branch
description: >
  GitLab protected branch management via API. Use for viewing branch
  protection rules, protecting and unprotecting branches, and
  configuring push and merge access levels.
---

# GitLab Protected Branch Skill

## Patterns

### List protected branches
```
gitlab_api({ endpoint: "projects/:project/protected_branches", project: "namespace/project" })
```

### Get protection details for a branch
```
gitlab_api({ endpoint: "projects/:project/protected_branches/:branch_name", project: "namespace/project" })
```

### Protect a branch
```
gitlab_api({
  endpoint: "projects/:project/protected_branches",
  project: "namespace/project",
  method: "POST",
  body: { name: "main", push_access_level: 40, merge_access_level: 40 },
  confirm: true
})
```

### Update protection (allow force push)
```
gitlab_api({
  endpoint: "projects/:project/protected_branches/:branch_name",
  project: "namespace/project",
  method: "PATCH",
  body: { allow_force_push: true },
  confirm: true
})
```

### Unprotect a branch
```
gitlab_api({
  endpoint: "projects/:project/protected_branches/:branch_name",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

## Rules

- All mutating operations require `confirm: true`.
- Access levels: 0 = No access, 30 = Developer, 40 = Maintainer, 60 = Admin.
- Code owner approval requires GitLab Premium.
- The `gitlab_force_push_safe` tool handles the full protection lifecycle for safe force pushes.
- Use this skill for general protection management; use `gitlab_force_push_safe` for force-push workflows.
