---
name: gitlab-milestone
description: >
  GitLab milestone management using the glab CLI and API. Use for
  listing, creating, and managing project milestones and sprints.
---

# GitLab Milestone Skill

## Patterns

### List milestones
```bash
glab milestone list
```

### Create a milestone
```bash
glab milestone create "v1.0" -d "First stable release"
```

### List milestones via API (structured)
```
gitlab_api({ endpoint: "projects/:project/milestones", project: "namespace/project" })
```

### Create milestone via API
```
gitlab_api({
  endpoint: "projects/:project/milestones",
  project: "namespace/project",
  method: "POST",
  body: {
    title: "v1.0",
    description: "First stable release",
    due_date: "2026-06-30"
  },
  confirm: true
})
```

### Update a milestone
```
gitlab_api({
  endpoint: "projects/:project/milestones/:milestone_id",
  project: "namespace/project",
  method: "PUT",
  body: { state_event: "close" },
  confirm: true
})
```

### Delete a milestone
```
gitlab_api({
  endpoint: "projects/:project/milestones/:milestone_id",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

## Rules

- All mutating operations require `confirm: true`.
- Use milestone IDs (numeric) for update and delete operations.
- Milestones are project-scoped; group milestones use the group API endpoint.
- For assigning milestones to issues, use `gitlab-issue` skill.
