---
name: gitlab-file
description: >
  GitLab repository file operations via API. Use for reading file content,
  blame info, and creating, updating, or deleting files through the
  GitLab API (not local files).
---

# GitLab File Skill

## Patterns

### Get file metadata and content (base64)
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path",
  project: "namespace/project",
  query: { ref: "main" }
})
```

### Get raw file content
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path/raw",
  project: "namespace/project",
  query: { ref: "main" }
})
```

### Get file blame info
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path/blame",
  project: "namespace/project",
  query: { ref: "main" }
})
```

### Create a file
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path",
  project: "namespace/project",
  method: "POST",
  body: {
    branch: "main",
    content: "file content here",
    commit_message: "Add new file"
  },
  confirm: true
})
```

### Update a file
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path",
  project: "namespace/project",
  method: "PUT",
  body: {
    branch: "main",
    content: "updated content",
    commit_message: "Update file"
  },
  confirm: true
})
```

### Delete a file
```
gitlab_api({
  endpoint: "projects/:project/repository/files/:encoded_path",
  project: "namespace/project",
  method: "DELETE",
  body: { branch: "main", commit_message: "Remove file" },
  confirm: true
})
```

## Rules

- File paths in endpoints must be URL-encoded (e.g. `src%2Findex.ts`).
- All mutating operations require `confirm: true`.
- `branch` and `commit_message` are required for create, update, and delete.
- For editing local files, use file editing tools — this skill is for API-side file operations only.
