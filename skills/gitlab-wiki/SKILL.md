---
name: gitlab-wiki
description: >
  GitLab wiki page management via API. Use for listing, reading, creating,
  updating, and deleting wiki pages, and uploading attachments.
---

# GitLab Wiki Skill

## Patterns

### List wiki pages
```
gitlab_api({ endpoint: "projects/:project/wikis", project: "namespace/project" })
```

### Get a wiki page
```
gitlab_api({ endpoint: "projects/:project/wikis/:slug", project: "namespace/project" })
```

### Create a wiki page
```
gitlab_api({
  endpoint: "projects/:project/wikis",
  project: "namespace/project",
  method: "POST",
  body: { title: "Architecture Overview", content: "# Architecture\n\n..." },
  confirm: true
})
```

### Update a wiki page
```
gitlab_api({
  endpoint: "projects/:project/wikis/:slug",
  project: "namespace/project",
  method: "PUT",
  body: { content: "# Updated Architecture\n\n..." },
  confirm: true
})
```

### Delete a wiki page
```
gitlab_api({
  endpoint: "projects/:project/wikis/:slug",
  project: "namespace/project",
  method: "DELETE",
  confirm: true
})
```

### Upload a wiki attachment
```
gitlab_api({
  endpoint: "projects/:project/wikis/attachments",
  project: "namespace/project",
  method: "POST",
  body: { file: "path/to/file", branch: "main" },
  confirm: true
})
```

## Rules

- All mutating operations require `confirm: true`.
- Wiki slugs are URL-friendly versions of the title (e.g. "Architecture Overview" → "architecture-overview").
- Wiki content supports Markdown and RDoc formats.
- Use `format` field to specify content format: `markdown` (default), `rdoc`, or `asciidoc`.
