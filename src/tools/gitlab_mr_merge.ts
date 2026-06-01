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

export function registerGitlabMrMerge(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_mr_merge",
		label: "Merge Merge Request",
		description: "Merge an open merge request. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				mrId: Type.Number({ description: "MR IID" }),
				squash: Type.Optional(Type.Boolean({ default: false })),
				removeSourceBranch: Type.Optional(Type.Boolean({ default: false })),
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

			const projectPath = await resolveProject(params.project, ctx.cwd);
			const projectId = await resolveProjectId(projectPath);

			// Fetch MR details for the preview
			const mr = (await glab([
				"api",
				`projects/${projectId}/merge_requests/${params.mrId}`,
			])) as Record<string, unknown>;

			const preview = `Merge MR !${params.mrId}: **${mr.title}**\n${mr.source_branch} → ${mr.target_branch}\nProject: \`${projectPath}\`${params.squash ? "\n(squash)" : ""}${params.removeSourceBranch ? "\n(remove source branch)" : ""}`;
			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			const body: Record<string, unknown> = {};
			if (params.squash !== undefined) body.squash = params.squash;
			if (params.removeSourceBranch !== undefined)
				body.should_remove_source_branch = params.removeSourceBranch;

			const result = await glab([
				"api",
				"-X",
				"PUT",
				`projects/${projectId}/merge_requests/${params.mrId}/merge`,
				...(Object.keys(body).length > 0
					? Object.entries(body).flatMap(([k, v]) => ["-f", `${k}=${v}`])
					: []),
			]);

			return {
				content: [
					{
						type: "text",
						text: `✅ MR !${params.mrId} merged\n${(result as Record<string, unknown>).web_url ?? ""}`,
					},
				],
				details: { success: true, mr: result },
			};
		},
	});
}
