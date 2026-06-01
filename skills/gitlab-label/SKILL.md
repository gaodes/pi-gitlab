---
name: gitlab-label
description: >
  GitLab label management using the glab CLI. Use for listing and
  creating project labels to organize issues and merge requests.
---

# GitLab Label Skill

## Patterns

### List project labels
```bash
glab label list
```

### Create a label
```bash
glab label create "bug" -c "#FF0000" -d "Bug report"
```

### List labels via API (structured)
```
gitlab_api({ endpoint: "projects/:project/labels", project: "namespace/project" })
```

### Create label via API
```
gitlab_api({
  endpoint: "projects/:project/labels",
  project: "namespace/project",
  method: "POST",
  body: { name: "bug", color: "#FF0000", description: "Bug report" },
  confirm: true
})
```

### Update a label
```
gitlab_api({
  endpoint: "projects/:project/labels/:label_name",
  project: "namespace/project",
  method: "PUT",
  body: { color: "#00FF00", description: "Updated description" },
  confirm: true
})
```

### Delete a label
```
gitlab_api({
  endpoint: "projects/:project/labels/:label_name",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

## Rules

- Color values must be in hex format (e.g. `#FF0000`).
- All mutating operations require `confirm: true`.
- For applying labels to issues or MRs, use `gitlab-issue` or `gitlab-mr` skills.
- Labels are project-scoped; group labels use the group API endpoint.
