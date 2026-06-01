/**
 * Environment / config helpers for pi-gitlab.
 *
 * Phase 1 hard guard: tools must block until both GITLAB_TOKEN and
 * pi-gitlab config are present. Auto-seeding is intentionally
 * removed from extension load; seeding now lives in explicit doctor/setup flows.
 */

import { checkSetup } from "../config/guard.js";
import {
	GLOBAL_SETTINGS_PATH,
	ensureConfig,
	loadConfig,
} from "../config/loader.js";

export { GLOBAL_SETTINGS_PATH, ensureConfig, loadConfig };

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
