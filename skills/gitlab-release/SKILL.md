---
name: gitlab-release
description: >
  GitLab release management. Use for listing, viewing, and creating
  releases tied to Git tags on the configured GitLab instance. Requires glab and
  confirm for mutating operations.
---

# GitLab Release Skill

## Patterns

### List releases
```
gitlab_api({ endpoint: "projects/:project/releases" })
```

### View a single release
```
gitlab_api({ endpoint: "projects/:project/releases/:tag", project: "namespace/project" })
```

### Create a release from a tag
```
gitlab_api({
  method: "POST",
  endpoint: "projects/:project/releases",
  project: "namespace/project",
  body: {
    tag_name: "v1.2.0",
    name: "v1.2.0",
    description: "## What changed\n...",
    ref: "main"
  },
  confirm: true
})
```

## Rules

- Always resolve project path with `gitlab_project_resolve` before calling `gitlab_api` with `:project`.
- Creating releases requires `confirm: true`; list and view are read-only.
- Use `glab api` with numeric project IDs — path-encoded URLs break behind the local reverse proxy.
- Tag must exist before creating a release; create the tag first if needed.
- Keep release notes in Keep a Changelog format when possible.
