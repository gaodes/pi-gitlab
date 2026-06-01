import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { limitRows } from "../lib/pagination.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { MaxRows, OptionalProject } from "../lib/schemas.js";

interface MR {
	iid: number;
	title: string;
	author?: { name?: string };
	state: string;
	pipeline?: { status?: string };
	target_branch?: string;
}

export function registerGitlabMrList(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_mr_list",
		label: "List Merge Requests",
		description:
			"List merge requests with optional filters and transparent pagination.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				state: Type.Optional(
					Type.Union(
						[
							Type.Literal("opened"),
							Type.Literal("closed"),
							Type.Literal("merged"),
							Type.Literal("all"),
						],
						{ default: "opened" },
					),
				),
				author: Type.Optional(Type.String()),
				assignee: Type.Optional(Type.String()),
				reviewer: Type.Optional(Type.String()),
				labels: Type.Optional(Type.Array(Type.String())),
				targetBranch: Type.Optional(Type.String()),
				sourceBranch: Type.Optional(Type.String()),
				maxRows: MaxRows,
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

			const query = new URLSearchParams();
			query.set("state", params.state ?? "opened");
			if (params.author) query.set("author_username", params.author);
			if (params.assignee) query.set("assignee_username", params.assignee);
			if (params.reviewer) query.set("reviewer_username", params.reviewer);
			if (params.labels?.length) query.set("labels", params.labels.join(","));
			if (params.targetBranch) query.set("target_branch", params.targetBranch);
			if (params.sourceBranch) query.set("source_branch", params.sourceBranch);
			query.set("per_page", "100");

			const mrs = (await glab([
				"api",
				"--paginate",
				`projects/${projectId}/merge_requests?${query.toString()}`,
			])) as MR[];

			const limited = limitRows(mrs, params.maxRows ?? 25);
			if (limited.length === 0) {
				return {
					content: [{ type: "text", text: "No merge requests found." }],
					details: { success: true, count: 0, mrs: [] },
				};
			}

			const lines = [
				"| IID | Title | Author | State | Pipeline | Target |",
				"|---|---|---|---|---|---|",
			];
			for (const mr of limited) {
				lines.push(
					`| ${mr.iid} | ${mr.title} | ${mr.author?.name ?? "-"} | ${mr.state} | ${mr.pipeline?.status ?? "-"} | ${mr.target_branch ?? "-"} |`,
				);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, count: limited.length, mrs: limited },
			};
		},
	});
}
