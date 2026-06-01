import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { requireConfirm } from "../lib/confirm.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { OptionalProject } from "../lib/schemas.js";

export function registerGitlabReleaseCreate(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_release_create",
		label: "Create Release",
		description: "Create a GitLab release from an existing tag. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				tag: Type.String({ description: "Existing Git tag name" }),
				name: Type.String({ description: "Release title" }),
				description: Type.Optional(Type.String({ description: "Release notes (markdown)" })),
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

			const preview = `Create release **${params.name}** from tag \`${params.tag}\`\nProject: \`${projectPath}\``;
			const blocked = requireConfirm(preview, { confirm: params.confirm, dryRun: params.dryRun });
			if (blocked) return blocked;

			const body: Record<string, unknown> = {
				tag_name: params.tag,
				name: params.name,
			};
			if (params.description) body.description = params.description;

			const result = await glab([
				"api",
				"-X",
				"POST",
				`projects/${projectId}/releases`,
				...Object.entries(body).flatMap(([k, v]) => ["-f", `${k}=${v}`]),
			]);

			const release = result as Record<string, unknown>;
			return {
				content: [
					{
						type: "text",
						text: `✅ Release created: ${release.tag_name} — ${release.name}\n${(release._links as Record<string, string> | undefined)?.self ?? ""}`,
					},
				],
				details: { success: true, release },
			};
		},
	});
}
