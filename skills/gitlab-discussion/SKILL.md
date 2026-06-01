---
name: gitlab-discussion
description: >
  GitLab threaded discussion management on merge requests and issues.
  Use for listing, creating, and replying to discussion threads, and
  resolving or unresolving discussions.
---

# GitLab Discussion Skill

## Patterns

### List MR discussions
```
gitlab_api({ endpoint: "projects/:project/merge_requests/:iid/discussions", project: "namespace/project" })
```

### List issue discussions
```
gitlab_api({ endpoint: "projects/:project/issues/:iid/discussions", project: "namespace/project" })
```

### Get a specific discussion
```
gitlab_api({ endpoint: "projects/:project/merge_requests/:iid/discussions/:discussion_id", project: "namespace/project" })
```

### Create a new discussion thread on an MR
```
gitlab_api({
  endpoint: "projects/:project/merge_requests/:iid/discussions",
  project: "namespace/project",
  method: "POST",
  body: { body: "Review comment on this MR" },
  confirm: true
})
```

### Create a position-based (line-specific) discussion
```
gitlab_api({
  endpoint: "projects/:project/merge_requests/:iid/discussions",
  project: "namespace/project",
  method: "POST",
  body: {
    body: "Nit: consider using const here",
    position: {
      base_sha: "abc123",
      head_sha: "def456",
      start_sha: "abc123",
      position_type: "text",
      new_path: "src/index.ts",
      new_line: 42
    }
  },
  confirm: true
})
```

### Reply to a discussion
```
gitlab_api({
  endpoint: "projects/:project/merge_requests/:iid/discussions/:discussion_id/notes",
  project: "namespace/project",
  method: "POST",
  body: { body: "Agreed, will fix" },
  confirm: true
})
```

### Resolve a discussion
```
gitlab_api({
  endpoint: "projects/:project/merge_requests/:iid/discussions/:discussion_id",
  project: "namespace/project",
  method: "PUT",
  body: { resolved: true },
  confirm: true
})
```

### Delete a note
```
gitlab_api({
  endpoint: "projects/:project/merge_requests/:iid/discussions/:discussion_id/notes/:note_id",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

## Rules

- All mutating operations require `confirm: true`.
- For line-specific code review comments, include the `position` object with SHA references.
- Discussion IDs and note IDs are numeric; list discussions first.
- Use `resolved: false` to unresolve a previously resolved discussion.
