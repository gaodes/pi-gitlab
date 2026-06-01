/**
 * Environment / config helpers for pi-gitlab.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { checkSetup } from "../config/guard.js";
import { GLOBAL_SETTINGS_PATH, loadConfig } from "../config/loader.js";

export { checkSetup, GLOBAL_SETTINGS_PATH, loadConfig };

// ---------------------------------------------------------------------------
// Token access
// ---------------------------------------------------------------------------

/** Get the effective GitLab token from env or config. */
export function getToken(): string | undefined {
	const config = loadConfig();
	const envKey = config.tokenEnv || "GITLAB_TOKEN";
	const val = process.env[envKey];
	return val?.trim() ? val.trim() : undefined;
}

/** True when a valid token is available (env var or config). */
export function isConfigured(): boolean {
	return !!getToken();
}

// ---------------------------------------------------------------------------
// Config seeding
// ---------------------------------------------------------------------------

/** Auto-seed default pi-gitlab config into global prime-settings.json if missing. */
export function ensureConfig(): void {
	let settings: Record<string, unknown> = {};
	if (existsSync(GLOBAL_SETTINGS_PATH)) {
		try {
			settings = JSON.parse(readFileSync(GLOBAL_SETTINGS_PATH, "utf-8"));
		} catch {
			settings = {};
		}
	}
	if (!settings["pi-gitlab"]) {
		settings["pi-gitlab"] = {
			hostname: "gitlab.elches.dev",
			sshHostname: "gitlab-ssh.elches.dev",
			sshPort: 2222,
			apiBase: "https://gitlab.elches.dev/api/v4",
			tokenRef: null,
			tokenEnv: "GITLAB_TOKEN",
			defaultProjectId: null,
			defaultProjectPath: null,
			render: { tableMaxRows: 25, diffMaxLines: 400, logTailLines: 200 },
			safety: {
				requireConfirmForDelete: true,
				previewMutatingApiCalls: true,
				redactJobLogsByDefault: true,
				forcePushReprotectAlways: true,
				minGlabVersion: "1.40.0",
			},
		};
		writeFileSync(GLOBAL_SETTINGS_PATH, JSON.stringify(settings, null, 2));
	}
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Returns the effective API hostname from config (or GITLAB_HOST env override). */
export function getApiHost(): string {
	if (process.env.GITLAB_HOST) return process.env.GITLAB_HOST;
	return loadConfig().hostname;
}

/** Returns the SSH hostname for git remotes. */
export function getSshHost(): string {
	return loadConfig().sshHostname;
}

/** Returns the SSH port for git remotes. */
export function getSshPort(): number {
	return loadConfig().sshPort;
}
