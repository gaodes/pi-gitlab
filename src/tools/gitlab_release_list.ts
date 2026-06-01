import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { limitRows } from "../lib/pagination.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject, MaxRows } from "../lib/schemas.js";

interface Release {
	tag_name: string;
	name: string;
	description?: string;
	created_at: string;
	author?: { name?: string };
}

export function registerGitlabReleaseList(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_release_list",
		label: "List Releases",
		description: "List GitLab releases for a project.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				maxRows: MaxRows,
			},
			{ additionalProperties: false },
		),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx: ExtensionContext) {
			try {
					requireSetup(ctx.cwd);
				} catch {
					return setupRequiredResult();
				}

				const projectPath = await resolveProject(params.project, ctx.cwd);
			const projectId = await resolveProjectId(projectPath);

			const releases = (await glab([
				"api",
				"--paginate",
				`projects/${projectId}/releases?per_page=100`,
			])) as Release[];

			const limited = limitRows(releases, params.maxRows ?? 25);
			if (limited.length === 0) {
				return {
					content: [{ type: "text", text: "No releases found." }],
					details: { success: true, count: 0, releases: [] },
				};
			}

			const lines = ["| Tag | Name | Created | Author |", "|---|---|---|---|"];
			for (const r of limited) {
				lines.push(
					`| ${r.tag_name} | ${r.name} | ${r.created_at.split("T")[0]} | ${r.author?.name ?? "-"} |`,
				);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, count: limited.length, releases: limited },
			};
		},
	});
}
