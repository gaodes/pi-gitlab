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

interface LintResult {
	valid: boolean;
	errors?: string[];
	warnings?: string[];
	merged_yaml?: string;
}

function formatLintResult(result: LintResult) {
	const lines: string[] = [];

	if (result.valid) {
		lines.push("✅ CI configuration is **valid**.");
	} else {
		lines.push("❌ CI configuration has **errors**.");
	}

	if (result.errors && result.errors.length > 0) {
		lines.push("");
		lines.push("**Errors:**");
		for (const err of result.errors) {
			lines.push(`- ${err}`);
		}
	}

	if (result.warnings && result.warnings.length > 0) {
		lines.push("");
		lines.push("**Warnings:**");
		for (const warn of result.warnings) {
			lines.push(`- ${warn}`);
		}
	}

	return {
		content: [{ type: "text" as const, text: lines.join("\n") }],
		details: {
			success: true,
			valid: result.valid,
			errors: result.errors ?? [],
			warnings: result.warnings ?? [],
		},
	};
}

export function registerGitlabCiLint(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_ci_lint",
		label: "Lint CI Configuration",
		description:
			"Validate .gitlab-ci.yml configuration via the GitLab CI lint API. Returns errors and warnings.",
		parameters: Type.Object(
			{
				project: OptionalProject,
				content: Type.Optional(
					Type.String({
						description:
							"CI YAML content to validate. Omit to lint the project's existing .gitlab-ci.yml.",
					}),
				),
				ref: Type.Optional(
					Type.String({
						description:
							"Branch or tag ref for context when linting existing config.",
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

			const projectPath = await resolveProject(params.project, ctx.cwd);
			const projectId = await resolveProjectId(projectPath);

			const endpoint = `projects/${projectId}/ci/lint`;
			let content = params.content;
			const ref = params.ref;

			// If no content provided, fetch existing .gitlab-ci.yml
			if (!content) {
				try {
					const fileRef = ref ?? "HEAD";
					content = (await glab([
						"api",
						`projects/${projectId}/repository/files/.gitlab-ci.yml/raw?ref=${fileRef}`,
					])) as string;
				} catch {
					return {
						content: [
							{
								type: "text",
								text: "Could not fetch `.gitlab-ci.yml` from the repository. Provide `content` parameter with the YAML to validate.",
							},
						],
						details: {
							success: false,
							error: "file_not_found",
						},
					};
				}
			}

			const result = (await glab([
				"api",
				"-X",
				"POST",
				endpoint,
				"-f",
				`content=${content}`,
				...(ref ? ["-f", `ref=${ref}`] : []),
				"-f",
				"include_merged_yaml=true",
			])) as LintResult;

			return formatLintResult(result);
		},
	});
}
