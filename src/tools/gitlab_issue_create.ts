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

export function registerGitlabIssueCreate(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_issue_create",
		label: "Create Issue",
		description: "Create a new issue. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				title: Type.String({ description: "Issue title" }),
				description: Type.Optional(
					Type.String({ description: "Issue description" }),
				),
				labels: Type.Optional(Type.Array(Type.String())),
				assignee: Type.Optional(Type.String()),
				milestone: Type.Optional(Type.String()),
				confidential: Type.Optional(Type.Boolean({ default: false })),
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

			const preview = `Create issue **${params.title}**\nProject: \`${projectPath}\`${params.labels?.length ? `\nLabels: ${params.labels.join(", ")}` : ""}`;
			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			const body: Record<string, unknown> = { title: params.title };
			if (params.description) body.description = params.description;
			if (params.labels?.length) body.labels = params.labels.join(",");
			if (params.assignee) body.assignee_ids = params.assignee;
			if (params.milestone) body.milestone_id = params.milestone;
			if (params.confidential) body.confidential = true;

			const result = await glab([
				"api",
				"-X",
				"POST",
				`projects/${projectId}/issues`,
				...Object.entries(body).flatMap(([k, v]) => ["-f", `${k}=${v}`]),
			]);

			const issue = result as Record<string, unknown>;
			return {
				content: [
					{
						type: "text",
						text: `✅ Issue created: #${issue.iid} — ${issue.title}\n${issue.web_url ?? ""}`,
					},
				],
				details: { success: true, issue },
			};
		},
	});
}
