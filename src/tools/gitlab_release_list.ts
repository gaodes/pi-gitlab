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

interface Release {
	tag_name: string;
	name?: string;
	author?: { name?: string };
	created_at?: string;
	upcoming_release?: boolean;
	assets?: { count?: number };
}

export function registerGitlabReleaseList(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_release_list",
		label: "List Releases",
		description:
			"List releases for a project with transparent pagination.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				sort: Type.Optional(
					Type.Union(
						[
							Type.Literal("desc"),
							Type.Literal("asc"),
						],
						{ default: "desc" },
					),
				),
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
			query.set("sort", params.sort ?? "desc");
			query.set("per_page", "100");

			const releases = (await glab([
				"api",
				"--paginate",
				`projects/${projectId}/releases?${query.toString()}`,
			])) as Release[];

			const limited = limitRows(releases, params.maxRows ?? 25);
			if (limited.length === 0) {
				return {
					content: [{ type: "text", text: "No releases found." }],
					details: { success: true, count: 0, releases: [] },
				};
			}

			const lines = [
				"| Tag | Name | Author | Date | Upcoming |",
				"|---|---|---|---|---|",
			];
			for (const rel of limited) {
				const date = rel.created_at
					? new Date(rel.created_at).toISOString().split("T")[0]
					: "-";
				lines.push(
					`| ${rel.tag_name} | ${rel.name ?? "-"} | ${rel.author?.name ?? "-"} | ${date} | ${rel.upcoming_release ? "yes" : "no"} |`,
				);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, count: limited.length, releases: limited },
			};
		},
	});
}
