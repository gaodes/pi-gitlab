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

export function registerGitlabReleaseCreate(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_release_create",
		label: "Create Release",
		description: "Create a new release for a tag. Requires confirmation.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				tagName: Type.String({ description: "Tag name (e.g. v0.3.0)" }),
				name: Type.Optional(
					Type.String({ description: "Release title. Defaults to tag name." }),
				),
				description: Type.Optional(
					Type.String({
						description: "Release notes in markdown.",
					}),
				),
				ref: Type.Optional(
					Type.String({
						description:
							"Branch, SHA, or tag to create the release from. Required when the tag does not already exist.",
					}),
				),
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

			const projectPath = await resolveProject(params.project, ctx.cwd);
			const projectId = await resolveProjectId(projectPath);

			const preview = `Create release **${params.name ?? params.tagName}**\nTag: \`${params.tagName}\`${params.ref ? `\nRef: \`${params.ref}\`` : ""}\nProject: \`${projectPath}\``;
			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			const body: Record<string, unknown> = {
				tag_name: params.tagName,
			};
			if (params.name) body.name = params.name;
			if (params.description) body.description = params.description;
			if (params.ref) body.ref = params.ref;

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
						text: `✅ Release created: ${release.tag_name} — ${release.name ?? release.tag_name}\n${(release._links as Record<string, unknown>)?.self ?? ""}`,
					},
				],
				details: { success: true, release },
			};
		},
	});
}
