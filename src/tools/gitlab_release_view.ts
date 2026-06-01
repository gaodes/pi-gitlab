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

export function registerGitlabReleaseView(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_release_view",
		label: "View Release",
		description:
			"View a single release by tag name, including description and asset links.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				tagName: Type.String({ description: "Release tag name (e.g. v1.0.0)" }),
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

			const release = (await glab([
				"api",
				`projects/${projectId}/releases/${encodeURIComponent(params.tagName)}`,
			])) as Record<string, unknown>;

			const assets = release.assets as Record<string, unknown> | undefined;
			const links =
				(assets?.links as Array<Record<string, unknown>> | undefined) ?? [];

			const lines: string[] = [];
			lines.push(`## Release: ${release.tag_name}`);
			if (release.name) lines.push(`**Name:** ${release.name}`);
			lines.push(
				`**Author:** ${(release.author as Record<string, unknown>)?.name ?? "-"}`,
			);
			if (release.created_at)
				lines.push(
					`**Created:** ${new Date(release.created_at as string).toISOString()}`,
				);
			if (release.upcoming_release) lines.push("**Upcoming release:** yes");

			if (release.description) {
				lines.push(`\n### Description\n${release.description}`);
			}

			if (links.length > 0) {
				lines.push("\n### Asset Links");
				for (const link of links) {
					lines.push(`- [${link.name ?? link.url}](${link.url})`);
				}
			}

			if (assets?.count !== undefined) {
				lines.push(`\n**Assets count:** ${assets.count}`);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, release },
			};
		},
	});
}
