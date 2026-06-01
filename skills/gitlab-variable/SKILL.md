---
name: gitlab-variable
description: >
  GitLab CI/CD variable management using the glab CLI. Use for listing,
  creating, updating, and deleting project and group CI/CD variables.
---

# GitLab CI/CD Variable Skill

## Patterns

### List project variables
```bash
glab variable list
```

### List group variables
```bash
glab variable list -g mygroup
```

### Get a variable value
```bash
glab variable get VARIABLE_KEY
```

### Set a variable
```bash
glab variable set DEPLOY_KEY "secret-value" --masked
```

### Update a variable
```bash
glab variable update VARIABLE_KEY "new-value"
```

### Delete a variable
```bash
glab variable delete VARIABLE_KEY
```

### Export variables
```bash
glab variable export
```

### List variables via API (structured)
```
gitlab_api({ endpoint: "projects/:project/variables", project: "namespace/project" })
```

### Create variable via API
```
gitlab_api({
  endpoint: "projects/:project/variables",
  project: "namespace/project",
  method: "POST",
  body: { key: "DEPLOY_KEY", value: "secret-value", masked: true },
  confirm: true
})
```

## Rules

- Masked variables hide values in job logs.
- Protected variables only apply to protected branches/tags.
- Environment-scoped variables use `environment_scope` parameter.
- All mutating operations require `confirm: true`.
- Never log or display variable values in plain text.
