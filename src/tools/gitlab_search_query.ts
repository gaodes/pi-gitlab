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
import { OptionalProject } from "../lib/schemas.js";

interface SearchResult {
	id?: number;
	iid?: number;
	name?: string;
	title?: string;
	path?: string;
	path_with_namespace?: string;
	description?: string;
	filename?: string;
	startline?: number;
	data?: string;
	username?: string;
	state?: string;
	web_url?: string;
	ref?: string;
	message?: string;
}

export function registerGitlabSearchQuery(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_search_query",
		label: "Search GitLab",
		description:
			"Search GitLab globally, within a group, or within a project. Supports projects, issues, merge requests, code blobs, commits, users, and wiki content.",
		parameters: Type.Object(
			{
				query: Type.String({
					description: "Search query string.",
					minLength: 1,
					maxLength: 200,
				}),
				scope: Type.Optional(
					Type.Union(
						[
							Type.Literal("projects"),
							Type.Literal("issues"),
							Type.Literal("merge_requests"),
							Type.Literal("milestones"),
							Type.Literal("blobs"),
							Type.Literal("commits"),
							Type.Literal("users"),
							Type.Literal("wiki_blobs"),
						],
						{
							description:
								"Search scope. Omit to search across common scopes (projects, issues, merge_requests, blobs).",
						},
					),
				),
				project: OptionalProject,
				group: Type.Optional(
					Type.String({
						description: "Group ID. Set to restrict search to this group.",
					}),
				),
				maxRows: Type.Optional(
					Type.Number({
						default: 25,
						maximum: 100,
						description: "Maximum results to return.",
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
				requireSetup(ctx.cwd);
			} catch {
				return setupRequiredResult();
			}

			const searchParams = new URLSearchParams();
			searchParams.set("search", params.query);

			// Determine endpoint based on scope
			let endpoint: string;
			let scopeDescription: string;

			if (params.project) {
				const projectPath = await resolveProject(params.project, ctx.cwd);
				const projectId = await resolveProjectId(projectPath);
				endpoint = `projects/${projectId}/search`;
				scopeDescription = `project ${params.project}`;
			} else if (params.group) {
				endpoint = `groups/${params.group}/search`;
				scopeDescription = `group ${params.group}`;
			} else {
				endpoint = "search";
				scopeDescription = "global";
			}

			// Run searches — if no specific scope given, search across key scopes
			const scopes = params.scope
				? [params.scope]
				: ["projects", "issues", "merge_requests", "blobs"];

			const allResults: Array<{
				scope: string;
				items: SearchResult[];
			}> = [];

			for (const scope of scopes) {
				searchParams.set("scope", scope);
				try {
					const results = (await glab([
						"api",
						`${endpoint}?${searchParams.toString()}`,
					])) as SearchResult[];
					const limited = limitRows(
						Array.isArray(results) ? results : [],
						params.maxRows ?? 25,
					);
					if (limited.length > 0) {
						allResults.push({ scope, items: limited });
					}
				} catch {
					// Scope may not be available at this level — skip silently
				}
			}

			if (allResults.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No results found for "${params.query}" (${scopeDescription}).`,
						},
					],
					details: {
						success: true,
						count: 0,
						query: params.query,
						scope: scopeDescription,
					},
				};
			}

			const lines: string[] = [];
			let totalCount = 0;

			for (const group of allResults) {
				totalCount += group.items.length;
				lines.push(`\n### ${group.scope}`);
				lines.push("");

				for (const item of group.items) {
					if (group.scope === "projects") {
						lines.push(
							`- **${item.name ?? item.path ?? "-"}** ${item.path_with_namespace ? `(\`${item.path_with_namespace}\`)` : ""} ${item.description ? `— ${item.description}` : ""}`,
						);
					} else if (group.scope === "issues") {
						lines.push(
							`- #${item.iid ?? "?"} **${item.title ?? "-"}** (${item.state ?? "?"}) ${item.web_url ?? ""}`,
						);
					} else if (group.scope === "merge_requests") {
						lines.push(
							`- !${item.iid ?? "?"} **${item.title ?? "-"}** (${item.state ?? "?"}) ${item.web_url ?? ""}`,
						);
					} else if (group.scope === "blobs") {
						lines.push(
							`- \`${item.filename ?? "?"}\`${item.startline ? `:${item.startline}` : ""} — ${item.ref ?? ""}`,
						);
					} else if (group.scope === "users") {
						lines.push(
							`- **${item.name ?? item.username ?? "-"}** (\`${item.username ?? "?"}\`)`,
						);
					} else if (group.scope === "commits") {
						lines.push(
							`- \`${(item.id ?? "").toString().slice(0, 8)}\` **${item.title ?? item.message ?? "-"}**`,
						);
					} else if (group.scope === "wiki_blobs") {
						lines.push(
							`- \`${item.filename ?? "?"}\`${item.startline ? `:${item.startline}` : ""}`,
						);
					} else if (group.scope === "milestones") {
						lines.push(`- **${item.title ?? "-"}** (${item.state ?? "?"})`);
					} else {
						lines.push(
							`- ${item.title ?? item.name ?? item.path ?? JSON.stringify(item)}`,
						);
					}
				}
			}

			return {
				content: [
					{
						type: "text",
						text: `Found **${totalCount}** results for "${params.query}" (${scopeDescription}):${lines.join("\n")}`,
					},
				],
				details: {
					success: true,
					count: totalCount,
					query: params.query,
					scope: scopeDescription,
					scopes: allResults.map((g) => g.scope),
				},
			};
		},
	});
}
