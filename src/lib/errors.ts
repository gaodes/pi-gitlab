// ---------------------------------------------------------------------------
// GlabError — pre-existing, used by lib/glab.ts
// ---------------------------------------------------------------------------

/** Structured error for glab CLI invocation failures. */
export class GlabError extends Error {
	constructor(
		message: string,
		public readonly code: GlabErrorCode,
		public readonly cause?: unknown,
		public readonly stderr?: string,
		public readonly exitCode?: number,
	) {
		super(message);
		this.name = "GlabError";
	}
}

export enum GlabErrorCode {
	NOT_FOUND = "NOT_FOUND",
	EXEC_FAILED = "EXEC_FAILED",
	PARSE_FAILED = "PARSE_FAILED",
	VERSION_TOO_OLD = "VERSION_TOO_OLD",
	AUTH_FAILED = "AUTH_FAILED",
	NETWORK_ERROR = "NETWORK_ERROR",
	API_ERROR = "API_ERROR",
	UNKNOWN = "UNKNOWN",
}

/** Map a glab process error to a GlabError. */
export function mapGlabError(
	err: unknown,
	stderr?: string,
	exitCode?: number,
): GlabError {
	if (err instanceof GlabError) return err;

	const message = err instanceof Error ? err.message : String(err);

	if (message.includes("command not found") || message.includes("ENOENT")) {
		return new GlabError(
			"glab CLI not found. Install glab >= 1.40.0 or run /gitlab-doctor.",
			GlabErrorCode.NOT_FOUND,
			err,
			stderr,
			exitCode,
		);
	}

	if (stderr) {
		if (
			stderr.includes("401") ||
			stderr.includes("403") ||
			stderr.includes("unauthorized") ||
			stderr.includes("authentication required")
		) {
			return new GlabError(
				"GitLab authentication failed. Check GITLAB_TOKEN.",
				GlabErrorCode.AUTH_FAILED,
				err,
				stderr,
				exitCode,
			);
		}
		if (
			stderr.includes("404") ||
			stderr.includes("not found") ||
			stderr.includes("Could not resolve")
		) {
			return new GlabError(
				`GitLab API error: ${stderr.slice(0, 300)}`,
				GlabErrorCode.API_ERROR,
				err,
				stderr,
				exitCode,
			);
		}
		if (
			stderr.includes("ETIMEDOUT") ||
			stderr.includes("ECONNREFUSED") ||
			stderr.includes("timeout") ||
			stderr.includes("getaddrinfo")
		) {
			return new GlabError(
				`GitLab network error: ${stderr.slice(0, 300)}`,
				GlabErrorCode.NETWORK_ERROR,
				err,
				stderr,
				exitCode,
			);
		}
	}

	return new GlabError(message, GlabErrorCode.UNKNOWN, err, stderr, exitCode);
}

// ---------------------------------------------------------------------------
// SetupRequiredError — Phase 1C: setup guard integration
// ---------------------------------------------------------------------------

import { isConfigured } from "./env.js";

/**
 * Error thrown when GitLab is not configured.
 * Caught at the tool level; results in an actionable message to the agent.
 */
export class SetupRequiredError extends Error {
	readonly type = "SetupRequiredError";
	constructor(message: string) {
		super(message);
		this.name = "SetupRequiredError";
	}
}

/**
 * Guard: throws SetupRequiredError if GitLab is not configured.
 * Call at the top of each tool's execute() function.
 *
 * Phase 1C setup guard — blocks tool usage until the user completes
 * /gitlab-doctor and supplies GITLAB_TOKEN or pi-gitlab.token in prime-settings.json.
 */
export function requireSetup(): void {
	if (isConfigured()) return;

	const message =
		"GitLab is not configured for pi-gitlab. " +
		"Run the `/gitlab-doctor` command to see what needs to be set up, " +
		"then follow the guided setup to add your GitLab host and token to `prime-settings.json`.";

	throw new SetupRequiredError(message);
}

/**
 * Returns a tool-error result when GitLab has not been configured.
 * Use in tool execute() when requireSetup() would throw.
 */
export function setupRequiredResult(): {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
} {
	return {
		content: [
			{
				type: "text" as const,
				text:
					"GitLab is not configured. " +
					"Run `/gitlab-doctor` to see what needs to be set up, " +
					"then follow the guided setup to add your GitLab host and token to `prime-settings.json`.",
			},
		],
		details: { success: false, error: "setup_required" },
	};
}
