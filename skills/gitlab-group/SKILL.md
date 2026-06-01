---
name: gitlab-group
description: >
  GitLab group management. Use for listing and managing groups,
  subgroups, group membership, and group-level projects.
---

# GitLab Group Skill

## Patterns

### List groups
```
gitlab_api({ endpoint: "groups" })
```

### Get group details
```
gitlab_api({ endpoint: "groups/:group_id" })
```

### List subgroups
```
gitlab_api({ endpoint: "groups/:group_id/subgroups" })
```

### List projects in a group
```
gitlab_api({ endpoint: "groups/:group_id/projects" })
```

### List group members
```
gitlab_api({ endpoint: "groups/:group_id/members" })
```

### Add a member to a group
```
gitlab_api({
  endpoint: "groups/:group_id/members",
  method: "POST",
  body: { user_id: 42, access_level: 30 },
  confirm: true
})
```

### Update member access level
```
gitlab_api({
  endpoint: "groups/:group_id/members/:user_id",
  method: "PUT",
  body: { access_level: 40 },
  confirm: true
})
```

### Remove a member
```
gitlab_api({
  endpoint: "groups/:group_id/members/:user_id",
  method: "DELETE",
  confirm: true
})
```

### Create a group
```
gitlab_api({
  endpoint: "groups",
  method: "POST",
  body: { name: "new-group", path: "new-group" },
  confirm: true
})
```

### Share a project with a group
```
gitlab_api({
  endpoint: "projects/:project/share",
  project: "namespace/project",
  method: "POST",
  body: { group_id: 42, group_access: 30 },
  confirm: true
})
```

## Rules

- All mutating operations require `confirm: true`.
- Use numeric group IDs (not paths) in API endpoints.
- Access levels: 10 = Guest, 20 = Reporter, 30 = Developer, 40 = Maintainer, 50 = Owner.
- For project-level members, use the repo settings API instead.
