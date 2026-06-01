/**
 * pi-gitlab — Pi extension for GitLab workflows via glab CLI.
 *
 * Phase 1 read-only tools:
 *   gitlab_project_resolve  — resolve project path to numeric ID
 *   gitlab_mr_list          — list merge requests
 *   gitlab_mr_view          — view a single MR
 *   gitlab_issue_list       — list issues
 *   gitlab_pipeline_status  — show pipeline status
 *   gitlab_job_logs         — fetch job logs
 *   gitlab_api              — generic glab API wrapper
 *
 * Phase 2 mutating tools (require confirm:true):
 *   gitlab_mr_create        — create a merge request
 *   gitlab_mr_merge         — merge a merge request
 *   gitlab_issue_create     — create an issue
 *   gitlab_issue_close      — close an issue
 *   gitlab_pipeline_run     — trigger a pipeline
 *
 * Phase 3 advanced tools:
 *   gitlab_release_list     — list releases
 *   gitlab_release_view     — view a single release
 *   gitlab_release_create   — create a release (confirm:true)
 *   gitlab_mr_bulk_approve  — bulk-approve MRs (confirm:true)
 *   gitlab_force_push_safe  — safe force push with branch protection lifecycle (confirm:true)
 *
 * Phase 4 search, CI lint, and repo tools:
 *   gitlab_search_query     — search GitLab across multiple scopes
 *   gitlab_ci_lint          — validate .gitlab-ci.yml configuration
 *   gitlab_repo_view        — view project/repository info
 *
 * In-package skills (0.3.0):
 *   /gitlab-doctor — diagnostic check for glab, auth, API, and config
 *
 * Configuration lives in prime-settings.json key `pi-gitlab`.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { gitlabDoctorCommand } from "./commands/gitlab-doctor.js";
import { registerResourcesDiscover } from "./events/resourcesDiscover.js";
import { registerGitlabApi } from "./tools/gitlab_api.js";
import { registerGitlabCiLint } from "./tools/gitlab_ci_lint.js";
import { registerGitlabForcePushSafe } from "./tools/gitlab_force_push_safe.js";
import { registerGitlabIssueClose } from "./tools/gitlab_issue_close.js";
import { registerGitlabIssueCreate } from "./tools/gitlab_issue_create.js";
import { registerGitlabIssueList } from "./tools/gitlab_issue_list.js";
import { registerGitlabJobLogs } from "./tools/gitlab_job_logs.js";
import { registerGitlabMrBulkApprove } from "./tools/gitlab_mr_bulk_approve.js";
import { registerGitlabMrCreate } from "./tools/gitlab_mr_create.js";
import { registerGitlabMrList } from "./tools/gitlab_mr_list.js";
import { registerGitlabMrMerge } from "./tools/gitlab_mr_merge.js";
import { registerGitlabMrView } from "./tools/gitlab_mr_view.js";
import { registerGitlabPipelineRun } from "./tools/gitlab_pipeline_run.js";
import { registerGitlabPipelineStatus } from "./tools/gitlab_pipeline_status.js";
import { registerGitlabProjectResolve } from "./tools/gitlab_project_resolve.js";
import { registerGitlabReleaseCreate } from "./tools/gitlab_release_create.js";
import { registerGitlabReleaseList } from "./tools/gitlab_release_list.js";
import { registerGitlabReleaseView } from "./tools/gitlab_release_view.js";
import { registerGitlabRepoView } from "./tools/gitlab_repo_view.js";
import { registerGitlabSearchQuery } from "./tools/gitlab_search_query.js";

export default function piGitlab(pi: ExtensionAPI) {
	// Expose in-package skills
	pi.on("resources_discover", () => registerResourcesDiscover());

	// Diagnostic command
	pi.registerCommand("gitlab-doctor", {
		description:
			"Run diagnostics for glab CLI, GitLab auth, API connectivity, and pi-gitlab config",
		handler: (args, ctx) => gitlabDoctorCommand(args, ctx, pi),
	});

	// Phase 1 read-only tools
	registerGitlabProjectResolve(pi);
	registerGitlabMrList(pi);
	registerGitlabMrView(pi);
	registerGitlabIssueList(pi);
	registerGitlabPipelineStatus(pi);
	registerGitlabJobLogs(pi);
	registerGitlabApi(pi);

	// Phase 2 mutating tools (all require confirm:true)
	registerGitlabMrCreate(pi);
	registerGitlabMrMerge(pi);
	registerGitlabIssueCreate(pi);
	registerGitlabIssueClose(pi);
	registerGitlabPipelineRun(pi);

	// Phase 3 advanced tools
	registerGitlabReleaseList(pi);
	registerGitlabReleaseView(pi);
	registerGitlabReleaseCreate(pi);
	registerGitlabMrBulkApprove(pi);
	registerGitlabForcePushSafe(pi);

	// Phase 4 search, CI lint, and repo tools
	registerGitlabSearchQuery(pi);
	registerGitlabCiLint(pi);
	registerGitlabRepoView(pi);
}
