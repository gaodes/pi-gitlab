# @gaodes/pi-gitlab

Pi extension package for GitLab workflows on `gitlab.elches.dev` using `glab` + in-package skills.

## Status

Scaffold and registration complete. Implementation proceeds by phased subagent execution:
- Phase 1: read-only tools + diagnostics + setup guard
- Phase 2: mutating tools + confirmation UX
- Phase 3: advanced flows + legacy archive

## Install (local dev)

```bash
npm install
```

## Standards

- Uses `prime-settings.json` key: `pi-gitlab`
- In-package skills registered via `resources_discover`
- Provenance tracked in `.upstream.json`
