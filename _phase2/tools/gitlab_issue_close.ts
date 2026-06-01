import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { requireConfirm } from "../lib/confirm.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

export function registerGitlabIssueClose(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_issue_close",
		label: "Close Issue",
		description: "Close an open issue. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				issueId: Type.Number({ description: "Issue IID" }),
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

			const issue = (await glab([
				"api",
				`projects/${projectId}/issues/${params.issueId}`,
			])) as Record<string, unknown>;

			const preview = `Close issue #${params.issueId}: **${issue.title}**\nProject: \`${projectPath}\``;
			const blocked = requireConfirm(preview, { confirm: params.confirm, dryRun: params.dryRun });
			if (blocked) return blocked;

			const result = await glab([
				"api",
				"-X",
				"PUT",
				`projects/${projectId}/issues/${params.issueId}`,
				"-f",
				"state_event=close",
			]);

			return {
				content: [
					{
						type: "text",
						text: `✅ Issue #${params.issueId} closed\n${(result as Record<string, unknown>).web_url ?? ""}`,
					},
				],
				details: { success: true, issue: result },
			};
		},
	});
}
