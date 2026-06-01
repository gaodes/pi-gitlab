import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

interface Pipeline {
	id: number;
	status: string;
	ref: string;
	sha: string;
	web_url?: string;
}

interface Job {
	id: number;
	name: string;
	status: string;
	stage: string;
}

export function registerGitlabPipelineStatus(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_pipeline_status",
		label: "Pipeline Status",
		description:
			"Check pipeline status for a branch, commit SHA, or pipeline ID.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				ref: Type.Optional(
					Type.String({ description: "Branch name or commit SHA." }),
				),
				pipelineId: Type.Optional(Type.Number()),
				includeJobs: Type.Optional(Type.Boolean({ default: false })),
			},
			{ additionalProperties: false },
		),
		async execute(
			_toolCallId,
			params,
			_signal,
			_onUpdate,
			ctx: ExtensionContext,
		) {
			try {
				requireSetup();
			} catch {
				return setupRequiredResult();
			}
			const cwd = ctx.cwd;
			const projectPath = await resolveProject(params.project, cwd);
			const projectId = await resolveProjectId(projectPath);

			let pipeline: Pipeline;

			if (params.pipelineId) {
				pipeline = (await glab([
					"api",
					`projects/${projectId}/pipelines/${params.pipelineId}`,
				])) as Pipeline;
			} else if (params.ref) {
				const pipelines = (await glab([
					"api",
					`projects/${projectId}/pipelines?ref=${encodeURIComponent(params.ref)}&per_page=1`,
				])) as Pipeline[];
				if (!pipelines.length) {
					return {
						content: [
							{
								type: "text",
								text: `No pipeline found for ref \`${params.ref}\`.`,
							},
						],
						details: { success: true, found: false },
					};
				}
				pipeline = pipelines[0];
			} else {
				const pipelines = (await glab([
					"api",
					`projects/${projectId}/pipelines?per_page=1`,
				])) as Pipeline[];
				if (!pipelines.length) {
					return {
						content: [{ type: "text", text: "No recent pipelines found." }],
						details: { success: true, found: false },
					};
				}
				pipeline = pipelines[0];
			}

			const parts = [
				`Pipeline **#${pipeline.id}** — ${pipeline.status}`,
				`Ref: \`${pipeline.ref}\``,
				`SHA: \`${pipeline.sha}\``,
				`URL: ${pipeline.web_url ?? "-"}`,
			];

			if (params.includeJobs) {
				const jobs = (await glab([
					"api",
					`projects/${projectId}/pipelines/${pipeline.id}/jobs?per_page=100`,
				])) as Job[];
				parts.push("\n| Job | Stage | Status |", "|---|---|---|");
				for (const job of jobs) {
					parts.push(`| ${job.name} | ${job.stage} | ${job.status} |`);
				}
			}

			return {
				content: [{ type: "text", text: parts.join("\n") }],
				details: { success: true, pipeline, jobs: params.includeJobs },
			};
		},
	});
}
