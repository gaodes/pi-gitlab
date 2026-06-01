import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { resolveProject } from "../lib/projectFallback.js";
import { redact } from "../lib/redact.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

export function registerGitlabJobLogs(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_job_logs",
		label: "Job Logs",
		description:
			"Fetch CI job log output. Redacts common secret patterns by default and truncates to the tail.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				jobId: Type.Number(),
				tail: Type.Optional(Type.Number({ default: 200, maximum: 5000 })),
				redact: Type.Optional(
					Type.Boolean({
						default: true,
						description:
							"Disable to view raw logs for debugging. Use with care.",
					}),
				),
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

			const logText = (await glab([
				"api",
				`projects/${projectId}/jobs/${params.jobId}/trace`,
			])) as string;

			const tailCount = params.tail ?? 200;
			const lines = logText.split("\n");
			const tailLines = lines.slice(-tailCount);
			let output = tailLines.join("\n");

			if (params.redact !== false) {
				output = redact(output);
			}

			return {
				content: [
					{
						type: "text",
						text:
							"```text\n" +
							output +
							"\n```\n\n*Showing last " +
							tailLines.length +
							" of " +
							lines.length +
							" lines" +
							(params.redact !== false ? " (redacted)" : "") +
							"*",
					},
				],
				details: {
					success: true,
					jobId: params.jobId,
					lines: tailLines.length,
					total: lines.length,
				},
			};
		},
	});
}
