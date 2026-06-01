import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";

export function registerGitlabProjectResolve(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_project_resolve",
		label: "Resolve GitLab Project",
		description:
			"Resolve a GitLab project path (namespace/path) to a numeric project ID. Searches with pagination, exact-matches path_with_namespace, verifies the ID, then caches.",
		parameters: Type.Object(
			{
				project: Type.Optional(
					Type.String({
						description:
							"Project path or numeric ID. Optional — falls back to CWD git remote, then settings default.",
					}),
				),
				force: Type.Optional(
					Type.Boolean({
						default: false,
						description: "Bypass cache and re-resolve.",
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

				const project = await resolveProject(params.project, ctx.cwd);
			const id = await resolveProjectId(project, params.force);
			return {
				content: [
					{
						type: "text",
						text: `Project \`${project}\` → ID **${id}**`,
					},
				],
				details: { success: true, project, id },
			};
		},
	});
}
