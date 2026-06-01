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

export function registerGitlabMrView(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_mr_view",
		label: "View Merge Request",
		description:
			"View a merge request with metadata, pipeline status, discussions, and optional diff.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				mrId: Type.Number({ description: "MR IID (project-relative number)." }),
				includeDiff: Type.Optional(Type.Boolean({ default: false })),
				includeDiscussions: Type.Optional(Type.Boolean({ default: true })),
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

			const mr = (await glab([
				"api",
				`projects/${projectId}/merge_requests/${params.mrId}`,
			])) as Record<string, unknown>;

			const parts: string[] = [];
			parts.push(`## MR !${params.mrId}: ${String(mr.title ?? "")}`);
			parts.push(`State: ${String(mr.state ?? "unknown")}`);
			parts.push(`Author: ${(mr.author as { name?: string })?.name ?? "-"}`);
			parts.push(
				`Source → Target: ${String(mr.source_branch ?? "?")} → ${String(mr.target_branch ?? "?")}`,
			);
			parts.push(`URL: ${String(mr.web_url ?? "-")}`);

			if (params.includeDiscussions) {
				try {
					const discussions = (await glab([
						"api",
						`projects/${projectId}/merge_requests/${params.mrId}/discussions`,
					])) as Array<Record<string, unknown>>;
					parts.push(`\nDiscussions: ${discussions.length}`);
				} catch {
					parts.push("\nDiscussions: unavailable");
				}
			}

			if (params.includeDiff) {
				try {
					const diff = (await glab([
						"api",
						`projects/${projectId}/merge_requests/${params.mrId}/changes`,
					])) as {
						changes?: Array<{
							old_path: string;
							new_path: string;
							diff: string;
						}>;
					};
					parts.push("\n### Diff");
					for (const c of diff.changes ?? []) {
						parts.push(`\n**${c.old_path}**`);
						parts.push("```diff");
						parts.push(c.diff.slice(0, 2000));
						parts.push("```");
					}
				} catch {
					parts.push("\nDiff: unavailable");
				}
			}

			return {
				content: [{ type: "text", text: parts.join("\n") }],
				details: { success: true, mr },
			};
		},
	});
}
