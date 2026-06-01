---
name: gitlab-webhook
description: >
  GitLab webhook management via API. Use for listing, creating, updating,
  and deleting project and group webhooks, and testing webhook delivery.
---

# GitLab Webhook Skill

## Patterns

### List project webhooks
```
gitlab_api({ endpoint: "projects/:project/hooks", project: "namespace/project" })
```

### Get webhook details
```
gitlab_api({ endpoint: "projects/:project/hooks/:hook_id", project: "namespace/project" })
```

### Create a webhook
```
gitlab_api({
  endpoint: "projects/:project/hooks",
  project: "namespace/project",
  method: "POST",
  body: {
    url: "https://example.com/hook",
    push_events: true,
    merge_requests_events: true
  },
  confirm: true
})
```

### Update a webhook
```
gitlab_api({
  endpoint: "projects/:project/hooks/:hook_id",
  project: "namespace/project",
  method: "PUT",
  body: { push_events: false, tag_push_events: true },
  confirm: true
})
```

### Delete a webhook
```
gitlab_api({
  endpoint: "projects/:project/hooks/:hook_id",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

### Test webhook delivery
```
gitlab_api({
  endpoint: "projects/:project/hooks/:hook_id/test/push",
  project: "namespace/project",
  method: "POST",
  confirm: true
})
```

### List group webhooks
```
gitlab_api({ endpoint: "groups/:group_id/hooks" })
```

## Rules

- All mutating operations require `confirm: true`.
- Webhook URLs must use HTTPS in production.
- Available event triggers for testing: `push`, `tag_push`, `issues`, `merge_requests`, `wiki_page`.
- Hook IDs are numeric; list webhooks first to find the ID.
- Secret tokens are returned only on creation; store them securely.
