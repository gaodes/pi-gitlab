---
name: gitlab-container
description: >
  GitLab container registry management. Use for listing repositories,
  viewing and deleting image tags, and cleaning up old container images.
---

# GitLab Container Registry Skill

## Patterns

### List container repositories
```
gitlab_api({ endpoint: "projects/:project/registry/repositories", project: "namespace/project" })
```

### Get a specific repository
```
gitlab_api({ endpoint: "projects/:project/registry/repositories/:repo_id", project: "namespace/project" })
```

### List tags in a repository
```
gitlab_api({ endpoint: "projects/:project/registry/repositories/:repo_id/tags", project: "namespace/project" })
```

### Get tag details
```
gitlab_api({ endpoint: "projects/:project/registry/repositories/:repo_id/tags/:tag", project: "namespace/project" })
```

### Delete a tag
```
gitlab_api({
  endpoint: "projects/:project/registry/repositories/:repo_id/tags/:tag",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

### Bulk delete tags by regex
```
gitlab_api({
  endpoint: "projects/:project/registry/repositories/:repo_id/tags",
  project: "namespace/project",
  method: "DELETE",
  body: { name_regex: ".*", keep_n: 5 },
  confirm: true
})
```

### Delete entire repository
```
gitlab_api({
  endpoint: "projects/:project/registry/repositories/:repo_id",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

## Rules

- Container deletion operations are **destructive and irreversible** — always confirm with the user before proceeding.
- Use `keep_n` when bulk-deleting to preserve recent tags.
- Repository and tag IDs are numeric; list first to find IDs.
