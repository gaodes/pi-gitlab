import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function registerGitlabApi(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_api",
		label: "GitLab API Passthrough",
		description:
			"Raw glab api passthrough with automatic numeric-project-ID resolution. DELETE requires explicit confirmation.",
		parameters: Type.Object(
			{
				method: Type.Optional(
					Type.Union(
						[
							Type.Literal("GET"),
							Type.Literal("POST"),
							Type.Literal("PUT"),
							Type.Literal("PATCH"),
							Type.Literal("DELETE"),
						],
						{ default: "GET" },
					),
				),
				endpoint: Type.String({
					description:
						"Endpoint with optional ':project' placeholder. Use numeric IDs for other path segments.",
				}),
				project: Type.Optional(
					Type.String({
						description: "Required if endpoint contains ':project'.",
					}),
				),
				body: Type.Optional(Type.Object({}, { additionalProperties: true })),
				query: Type.Optional(Type.Object({}, { additionalProperties: true })),
				confirm: Type.Optional(
					Type.Boolean({
						description:
							"Explicit confirmation flag required for DELETE. Mutating verbs print preview and proceed.",
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
				requireSetup();
			} catch {
				return setupRequiredResult();
			}
			const method = params.method ?? "GET";
			const isMutating = MUTATING_METHODS.has(method);

			if (isMutating && params.confirm !== true) {
				return {
					content: [
						{
							type: "text",
							text:
								"⚠️ Mutating GitLab API calls require explicit `confirm: true`. " +
								"Set confirm:true to proceed, or use GET for read-only requests.",
						},
					],
					details: { success: false, error: "confirmation_required" },
				};
			}

			let endpoint = params.endpoint;

			if (endpoint.includes(":project")) {
				if (!params.project) {
					return {
						content: [
							{
								type: "text",
								text: "Endpoint contains `:project` but no `project` parameter was provided.",
							},
						],
						details: { success: false, error: "missing_project" },
					};
				}
				const cwd = ctx.cwd;
				const projectPath = await resolveProject(params.project, cwd);
				const projectId = await resolveProjectId(projectPath);
				endpoint = endpoint.replace(":project", String(projectId));
			}

			if (params.query && Object.keys(params.query).length > 0) {
				const qs = new URLSearchParams();
				for (const [k, v] of Object.entries(params.query)) {
					if (v !== undefined) qs.set(k, String(v));
				}
				endpoint = `${endpoint}${endpoint.includes("?") ? "&" : "?"}${qs.toString()}`;
			}

			const args = ["api"];
			if (method !== "GET") {
				args.push("-X", method);
			}
			if (params.body && Object.keys(params.body).length > 0) {
				for (const [k, v] of Object.entries(params.body)) {
					if (v === undefined) continue;
					args.push(
						"-f",
						`${k}=${typeof v === "string" ? v : JSON.stringify(v)}`,
					);
				}
			}
			args.push(endpoint);

			const result = await glab(args);

			const text =
				typeof result === "string" ? result : JSON.stringify(result, null, 2);

			const preview =
				isMutating && method !== "DELETE"
					? `**${method}** \`${endpoint}\`\n\n`
					: "";

			return {
				content: [
					{
						type: "text",
						text: `${preview}\`\`\`json\n${text.slice(0, 3000)}\n\`\`\``,
					},
				],
				details: { success: true, method, endpoint, result },
			};
		},
	});
}
