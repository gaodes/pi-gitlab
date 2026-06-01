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

interface ProjectInfo {
	id: number;
	name: string;
	path: string;
	path_with_namespace: string;
	description?: string;
	default_branch?: string;
	visibility?: string;
	web_url?: string;
	ssh_url_to_repo?: string;
	http_url_to_repo?: string;
	created_at?: string;
	last_activity_at?: string;
	star_count?: number;
	forks_count?: number;
	open_issues_count?: number;
	namespace?: { name?: string; path?: string; kind?: string };
	topics?: string[];
	archived?: boolean;
	empty_repo?: boolean;
	language?: string;
}

export function registerGitlabRepoView(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_repo_view",
		label: "View Repository Info",
		description:
			"View detailed information about a GitLab project including URLs, stats, and metadata.",
		parameters: Type.Object(
			{
				project: OptionalProject,
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

			const info = (await glab([
				"api",
				`projects/${projectId}`,
			])) as ProjectInfo;

			const lines = [
				`## ${info.name}`,
				"",
				`| Field | Value |`,
				`|---|---|`,
				`| **Path** | \`${info.path_with_namespace}\` |`,
				`| **ID** | ${info.id} |`,
				`| **Visibility** | ${info.visibility ?? "-"} |`,
				`| **Default branch** | \`${info.default_branch ?? "-"}\` |`,
				`| **Language** | ${info.language ?? "-"} |`,
				`| **Archived** | ${info.archived ? "Yes" : "No"} |`,
				`| **Empty** | ${info.empty_repo ? "Yes" : "No"} |`,
				`| **Stars** | ${info.star_count ?? 0} |`,
				`| **Forks** | ${info.forks_count ?? 0} |`,
				`| **Open issues** | ${info.open_issues_count ?? 0} |`,
				...(info.created_at
					? [
							`| **Created** | ${new Date(info.created_at).toISOString().split("T")[0]} |`,
						]
					: []),
				...(info.last_activity_at
					? [
							`| **Last activity** | ${new Date(info.last_activity_at).toISOString().split("T")[0]} |`,
						]
					: []),
			];

			if (info.description) {
				lines.push("", `> ${info.description}`);
			}

			if (info.topics && info.topics.length > 0) {
				lines.push(
					"",
					`**Topics:** ${info.topics.map((t) => `\`${t}\``).join(", ")}`,
				);
			}

			if (info.web_url) {
				lines.push("", `**URL:** ${info.web_url}`);
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { success: true, project: info },
			};
		},
	});
}
