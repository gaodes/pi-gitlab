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

interface Issue {
	iid: number;
	title: string;
	state: string;
	author?: { name?: string };
	labels?: string[];
	milestone?: { title?: string };
	confidential?: boolean;
}

export function registerGitlabIssueList(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_issue_list",
		label: "List Issues",
		description: "List GitLab issues with optional filters.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				state: Type.Optional(
					Type.Union(
						[
							Type.Literal("opened"),
							Type.Literal("closed"),
							Type.Literal("all"),
						],
						{ default: "opened" },
					),
				),
				labels: Type.Optional(Type.Array(Type.String())),
				milestone: Type.Optional(Type.String()),
				author: Type.Optional(Type.String()),
				assignee: Type.Optional(Type.String()),
				confidential: Type.Optional(Type.Boolean()),
				search: Type.Optional(Type.String()),
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
				requireSetup();
			} catch {
				return setupRequiredResult();
			}
			const cwd = ctx.cwd;
			const projectPath = await resolveProject(params.project, cwd);
			const projectId = await resolveProjectId(projectPath);

			const query = new URLSearchParams();
			query.set("state", params.state ?? "opened");
			if (params.labels?.length) query.set("labels", params.labels.join(","));
			if (params.milestone) query.set("milestone_title", params.milestone);
			if (params.author) query.set("author_username", params.author);
			if (params.assignee) query.set("assignee_username", params.assignee);
			if (params.confidential !== undefined)
				query.set("confidential", String(params.confidential));
			if (params.search) query.set("search", params.search);
			query.set("per_page", "100");

			const issues = (await glab([
				"api",
				"--paginate",
				`projects/${projectId}/issues?${query.toString()}`,
			])) as Issue[];

			const limited = limitRows(issues, params.maxRows ?? 25);
			if (limited.length === 0) {
				return {
					content: [{ type: "text", text: "No issues found." }],
					details: { success: true, count: 0, issues: [] },
				};
			}

			const lines = [
				"| IID | Title | State | Author | Labels | Milestone |",
				"|---|---|---|---|---|---|",
			];
			for (const issue of limited) {
				const labels = issue.labels?.join(", ") ?? "-";
				const milestone = issue.milestone?.title ?? "-";
				lines.push(
					`| ${issue.iid} | ${issue.title}${issue.confidential ? " 🔒" : ""} | ${issue.state} | ${issue.author?.name ?? "-"} | ${labels} | ${milestone} |`,
				);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, count: limited.length, issues: limited },
			};
		},
	});
}
