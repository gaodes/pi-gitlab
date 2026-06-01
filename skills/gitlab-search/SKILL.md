---
name: gitlab-search
description: >
  GitLab search across projects, issues, merge requests, code, commits,
  users, and wiki content. Use for finding resources globally, within a
  group, or within a project.
---

# GitLab Search Skill

## Patterns

### Global search (all scopes)
```
gitlab_search_query({ query: "search term" })
```

### Search within a project
```
gitlab_search_query({ query: "search term", project: "namespace/project", scope: "blobs" })
```

### Search within a group
```
gitlab_search_query({ query: "search term", group: "group-id", scope: "issues" })
```

### Search specific scope via API
```
gitlab_api({ endpoint: "search", query: { scope: "projects", search: "pi-gitlab" } })
```

### Project-level code search
```
gitlab_api({
  endpoint: "projects/:project/search",
  project: "namespace/project",
  query: { scope: "blobs", search: "function pattern" }
})
```

## Rules

- Prefer `gitlab_search_query` for structured search results with automatic pagination.
- Available scopes: `projects`, `issues`, `merge_requests`, `milestones`, `blobs`, `commits`, `users`, `wiki_blobs`.
- Search results are limited to resources the authenticated user can access.
- For listing all items with known filters, prefer dedicated tools (`gitlab_issue_list`, `gitlab_mr_list`) over search.
