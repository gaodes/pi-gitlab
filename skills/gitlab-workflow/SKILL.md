---
name: gitlab-workflow
description: >
  Cross-domain GitLab workflow orchestration on gitlab.elches.dev.
  Combines tools into multi-step flows like release cut, hotfix, and
  issue-to-MR pipelines. Routes to focused skills for individual steps.
---

# GitLab Workflow Skill

## Patterns

### Release cut flow
1. Check pipeline status with `gitlab_pipeline_status` on the target branch.
2. Verify all MRs are merged with `gitlab_mr_list` (state: merged).
3. Create a Git tag via `git_tag` (pi-git).
4. Create the release with `gitlab-release` skill.
5. Push and verify with `gitlab_api` (GET release).

### Hotfix flow
1. Create a branch from the tagged release with `git_branch_create` (pi-git).
2. Create an MR targeting the release branch with `gitlab-mr` skill.
3. Monitor pipeline with `gitlab_pipeline_status`.
4. Merge with `gitlab_mr_merge` (confirm required).
5. Tag and release via `gitlab-release` skill.

### Issue-to-MR flow
1. List issues with `gitlab_issue_list` (labels, state).
2. Create a branch referencing the issue number.
3. Create an MR with `Closes #N` in the description via `gitlab-mr` skill.
4. Track pipeline and merge when green.

## Rules

- Every mutating step requires explicit `confirm: true`.
- Prefer dedicated tools over raw `gitlab_api` for each step.
- Use numeric project IDs for all `glab api` calls — path-encoded URLs break behind the reverse proxy.
- Resolve the project once with `gitlab_project_resolve` and reuse the ID across steps.
- After merge, wait for pipeline to pass before tagging or releasing.
