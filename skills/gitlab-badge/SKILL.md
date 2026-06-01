---
name: gitlab-badge
description: >
  GitLab project badge management. Use for listing, creating, updating,
  and deleting project badges, previewing badge rendering, and managing
  group-level badges.
---

# GitLab Badge Skill

## Patterns

### List project badges
```
gitlab_api({ endpoint: "projects/:project/badges", project: "namespace/project" })
```

### Get a specific badge
```
gitlab_api({ endpoint: "projects/:project/badges/:badge_id", project: "namespace/project" })
```

### Create a badge
```
gitlab_api({
  endpoint: "projects/:project/badges",
  project: "namespace/project",
  method: "POST",
  body: {
    link_url: "https://example.com",
    image_url: "https://img.shields.io/badge/build-passing-brightgreen"
  },
  confirm: true
})
```

### Update a badge
```
gitlab_api({
  endpoint: "projects/:project/badges/:badge_id",
  project: "namespace/project",
  method: "PUT",
  body: { image_url: "https://new-badge-url" },
  confirm: true
})
```

### Delete a badge
```
gitlab_api({
  endpoint: "projects/:project/badges/:badge_id",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

### Preview badge rendering
```
gitlab_api({
  endpoint: "projects/:project/badges/render",
  project: "namespace/project",
  query: { link_url: "https://example.com", image_url: "https://img.shields.io/..." }
})
```

### List group badges
```
gitlab_api({ endpoint: "groups/:group_id/badges" })
```

## Rules

- All mutating operations (create, update, delete) require `confirm: true`.
- Badge IDs are numeric; use list first to find the ID.
- `link_url` and `image_url` are required when creating badges.
- For group badges, use the group numeric ID (not path).
