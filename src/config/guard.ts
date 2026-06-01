import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "./loader.js";
import type { PiGitlabConfig } from "./types.js";

export interface SetupStatus {
	ready: boolean;
	missingToken: boolean;
	missingConfig: boolean;
	config: PiGitlabConfig;
	issues: string[];
}

/**
 * Check prerequisites for the pi-gitlab extension.
 *
 * Returns ready=true only when both GITLAB_TOKEN is set AND the
 * pi-gitlab key exists in prime-settings.json (global or project).
 *
 * The key alone is not enough; the extension intentionally blocks
 * until the config is explicitly present. Auto-seeding remains
 * available only inside explicit setup/doctor flows.
 *
 * If ready=false, the extension entry should block all tool usage
 * and start the interactive setup wizard.
 */
export function checkSetup(cwd?: string): SetupStatus {
	const config = loadConfig(cwd);
	const issues: string[] = [];

	const tokenValue = process.env[config.tokenEnv];
	const missingToken = !tokenValue || tokenValue.trim().length === 0;

	const hasExplicitConfig =
		hasPiGitlabKeyInGlobal() || hasPiGitlabKeyInProject(cwd);
	const missingConfig = !hasExplicitConfig;

	if (missingToken) {
		issues.push(
			`Environment variable ${config.tokenEnv} is not set. ` +
				`Set it or run the setup wizard.`,
		);
	}

	if (missingConfig) {
		issues.push(
			`No pi-gitlab configuration found in prime-settings.json. ` +
				`Run the setup wizard to create one.`,
		);
	}

	return {
		ready: !missingToken && !missingConfig,
		missingToken,
		missingConfig,
		config,
		issues,
	};
}

function hasPiGitlabKeyInGlobal(): boolean {
	try {
		const path = join(homedir(), ".pi", "agent", "prime-settings.json");
		if (!existsSync(path)) return false;
		const raw = readFileSync(path, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		return (
			parsed !== null &&
			typeof parsed === "object" &&
			!Array.isArray(parsed) &&
			"pi-gitlab" in parsed
		);
	} catch {
		return false;
	}
}

function hasPiGitlabKeyInProject(cwd?: string): boolean {
	if (!cwd) return false;

	try {
		const path = join(cwd, ".pi", "prime-settings.json");
		if (!existsSync(path)) return false;
		const raw = readFileSync(path, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		return (
			parsed !== null &&
			typeof parsed === "object" &&
			!Array.isArray(parsed) &&
			"pi-gitlab" in parsed
		);
	} catch {
		return false;
	}
}
