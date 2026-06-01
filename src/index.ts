/**
 * pi-gitlab — Pi extension for GitLab workflows via glab CLI.
 *
 * Tools:
 *   gitlab_project_resolve  — resolve project path to numeric ID
 *   gitlab_mr_list          — list merge requests
 *   gitlab_mr_view          — view a single MR
 *   gitlab_issue_list       — list issues
 *   gitlab_pipeline_status  — show pipeline status
 *   gitlab_job_logs         — fetch job logs
 *   gitlab_api              — generic glab API wrapper
 *
 * Commands:
 *   /gitlab-doctor — diagnostic check for glab, auth, API, and config
 *
 * Configuration lives in prime-settings.json key `pi-gitlab`.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { gitlabDoctorCommand } from "./commands/gitlab-doctor.js";
import { registerResourcesDiscover } from "./events/resourcesDiscover.js";
import { registerGitlabApi } from "./tools/gitlab_api.js";
import { registerGitlabIssueList } from "./tools/gitlab_issue_list.js";
import { registerGitlabJobLogs } from "./tools/gitlab_job_logs.js";
import { registerGitlabMrList } from "./tools/gitlab_mr_list.js";
import { registerGitlabMrView } from "./tools/gitlab_mr_view.js";
import { registerGitlabPipelineStatus } from "./tools/gitlab_pipeline_status.js";
import { registerGitlabProjectResolve } from "./tools/gitlab_project_resolve.js";
import { registerGitlabReleaseList } from "./tools/gitlab_release_list.js";
import { registerGitlabReleaseView } from "./tools/gitlab_release_view.js";

export default function piGitlab(pi: ExtensionAPI) {
	// Expose in-package skills
	pi.on("resources_discover", () => registerResourcesDiscover());

	// Diagnostic command
	pi.registerCommand("gitlab-doctor", {
		description:
			"Run diagnostics for glab CLI, GitLab auth, API connectivity, and pi-gitlab config",
		handler: (args, ctx) => gitlabDoctorCommand(args, ctx, pi),
	});

	// Phase 1 read-only / diagnostic tools
	registerGitlabProjectResolve(pi);
	registerGitlabMrList(pi);
	registerGitlabMrView(pi);
	registerGitlabIssueList(pi);
	registerGitlabPipelineStatus(pi);
	registerGitlabJobLogs(pi);
	registerGitlabReleaseList(pi);
	registerGitlabReleaseView(pi);
	registerGitlabApi(pi);
}
