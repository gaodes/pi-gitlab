import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { requireConfirm } from "../lib/confirm.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

export function registerGitlabMrCreate(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_mr_create",
		label: "Create Merge Request",
		description: "Create a new merge request. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				sourceBranch: Type.String({ description: "Source branch name" }),
				targetBranch: Type.String({ description: "Target branch name" }),
				title: Type.String({ description: "MR title" }),
				description: Type.Optional(Type.String({ description: "MR description (markdown supported)" })),
				draft: Type.Optional(Type.Boolean({ default: false })),
				confirm: Type.Optional(Type.Boolean({ default: false })),
				dryRun: Type.Optional(Type.Boolean({ default: false })),
			},
			{ additionalProperties: false },
		),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx: ExtensionContext) {
			try {
				requireSetup();
			} catch {
				return setupRequiredResult();
			}

			const cwd = ctx.cwd;
			const projectPath = await resolveProject(params.project, cwd);
			const projectId = await resolveProjectId(projectPath);

			const preview = `Create MR **${params.title}**\n${params.sourceBranch} → ${params.targetBranch}\nProject: \`${projectPath}\``;
			const blocked = requireConfirm(preview, { confirm: params.confirm, dryRun: params.dryRun });
			if (blocked) return blocked;

			const body: Record<string, unknown> = {
				source_branch: params.sourceBranch,
				target_branch: params.targetBranch,
				title: params.draft ? `Draft: ${params.title}` : params.title,
			};
			if (params.description) body.description = params.description;

			const result = await glab([
				"api",
				"-X",
				"POST",
				`projects/${projectId}/merge_requests`,
				...Object.entries(body).flatMap(([k, v]) => ["-f", `${k}=${v}`]),
			]);

			const mr = result as Record<string, unknown>;
			return {
				content: [
					{
						type: "text",
						text: `✅ MR created: !${mr.iid} — ${mr.title}\n${mr.web_url ?? ""}`,
					},
				],
				details: { success: true, mr },
			};
		},
	});
}
