---
name: gitlab-repo
description: >
  GitLab repository and project operations. Use for cloning, forking,
  viewing project info, creating repositories, and managing project
  settings.
---

# GitLab Repository Skill

## Patterns

### View project info (structured tool)
```
gitlab_repo_view({ project: "namespace/project" })
```

### Clone a repository
```bash
glab repo clone namespace/project
```

### Fork a project
```bash
glab repo fork namespace/project
```

### View repo in browser
```bash
glab repo view -w
```

### Create a new project
```bash
glab repo create my-project -d "Project description"
```

### Search repos
```bash
glab repo search "search term"
```

### Archive a project
```
gitlab_api({
  endpoint: "projects/:project/archive",
  project: "namespace/project",
  method: "POST",
  confirm: true
})
```

### Delete a project
```
gitlab_api({
  endpoint: "projects/:project",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

### List contributors
```bash
glab repo contributors
```

## Rules

- Use `gitlab_repo_view` for structured project metadata; use `glab repo view` for terminal display.
- Fork and clone are safe operations; archive and delete require `confirm: true`.
- Deleting a project is **irreversible** — always confirm explicitly.
