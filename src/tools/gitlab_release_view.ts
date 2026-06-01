import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
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
		description: "View a GitLab release by tag name.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				tag: Type.String({ description: "Release tag name" }),
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

			const release = (await glab([
				"api",
				`projects/${projectId}/releases/${encodeURIComponent(params.tag)}`,
			])) as Record<string, unknown>;

			const lines = [
				`## ${release.name ?? params.tag}`,
				`Tag: \`${release.tag_name}\``,
				`Created: ${release.created_at ?? "-"}`,
				`URL: ${(release._links as Record<string, string> | undefined)?.self ?? "-"}`,
				"",
				`${release.description ?? "_No description_"}`,
			];

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, release },
			};
		},
	});
}
