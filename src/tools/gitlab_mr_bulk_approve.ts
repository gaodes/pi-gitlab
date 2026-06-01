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

interface BulkResult {
	mrIid: number;
	success: boolean;
	message: string;
}

export function registerGitlabMrBulkApprove(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_mr_bulk_approve",
		label: "Bulk Approve MRs",
		description:
			"Approve multiple merge requests in a single operation. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				mrIds: Type.Array(Type.Number(), {
					description: "List of MR IIDs to approve",
					minItems: 1,
				}),
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

			const preview = `Approve ${params.mrIds.length} MR(s) in \`${projectPath}\`\nMRs: ${params.mrIds.map((id) => `!${id}`).join(", ")}`;
			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			const results: BulkResult[] = [];
			for (const mrId of params.mrIds) {
				try {
					await glab([
						"api",
						"-X",
						"POST",
						`projects/${projectId}/merge_requests/${mrId}/approve`,
					]);
					results.push({
						mrIid: mrId,
						success: true,
						message: "approved",
					});
				} catch (err) {
					results.push({
						mrIid: mrId,
						success: false,
						message: String(err instanceof Error ? err.message : err),
					});
				}
			}

			const succeeded = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			const lines: string[] = [];
			if (succeeded.length > 0) {
				lines.push(
					`✅ Approved ${succeeded.length} MR(s): ${succeeded.map((r) => `!${r.mrIid}`).join(", ")}`,
				);
			}
			if (failed.length > 0) {
				lines.push(`\n❌ Failed ${failed.length}:`);
				for (const f of failed) {
					lines.push(`  - !${f.mrIid}: ${f.message}`);
				}
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: {
					success: failed.length === 0,
					total: params.mrIds.length,
					approved: succeeded.length,
					failed: failed.length,
					results,
				},
			};
		},
	});
}
