import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireConfirm } from "../lib/confirm.js";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

export function registerGitlabPipelineRun(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_pipeline_run",
		label: "Run Pipeline",
		description: "Trigger a new pipeline for a branch. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				ref: Type.String({ description: "Branch or tag to run pipeline for" }),
				variables: Type.Optional(
					Type.Object({}, { additionalProperties: true }),
				),
				confirm: Type.Optional(Type.Boolean({ default: false })),
				dryRun: Type.Optional(Type.Boolean({ default: false })),
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
				requireSetup(ctx.cwd);
			} catch {
				return setupRequiredResult();
			}

			const cwd = ctx.cwd;
			const projectPath = await resolveProject(params.project, cwd);
			const projectId = await resolveProjectId(projectPath);

			const preview = `Trigger pipeline for \`${params.ref}\`\nProject: \`${projectPath}\``;
			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			const body: Record<string, unknown> = { ref: params.ref };
			if (params.variables && Object.keys(params.variables).length > 0) {
				body.variables = Object.entries(params.variables).map(
					([key, value]) => ({
						key,
						value: String(value),
					}),
				);
			}

			const result = await glab([
				"api",
				"-X",
				"POST",
				`projects/${projectId}/pipeline`,
				...Object.entries(body).flatMap(([k, v]) => [
					"-f",
					`${k}=${typeof v === "string" ? v : JSON.stringify(v)}`,
				]),
			]);

			const pipeline = result as Record<string, unknown>;
			return {
				content: [
					{
						type: "text",
						text: `✅ Pipeline triggered: #${pipeline.id}\nStatus: ${pipeline.status}\n${pipeline.web_url ?? ""}`,
					},
				],
				details: { success: true, pipeline },
			};
		},
	});
}
