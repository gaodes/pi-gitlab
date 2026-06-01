/**
 * /gitlab-doctor — diagnostics command for pi-gitlab.
 *
 * Checks:
 *   1. glab CLI is installed and meets minimum version (1.40.0)
 *   2. glab authentication status
 *   3. API connectivity to configured GitLab host
 *   4. prime-settings.json configuration state
 *   5. env-var token presence
 *
 * Reports pass/fail for each check and surfaces actionable next steps.
 */

import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { getApiHost } from "../lib/env.js";
import { checkSetup } from "../config/guard.js";
import { ensureConfig } from "../config/loader.js";

const MIN_GLAB_VERSION = "1.40.0";

interface Check {
	label: string;
	status: "pass" | "fail" | "warn" | "info";
	detail: string;
}

function versionSatisfies(installed: string, required: string): boolean {
	const [majI = 0, minI = 0, patI = 0] = installed
		.split(".")
		.map((n) => Number(n) || 0);
	const [majR = 0, minR = 0, patR = 0] = required
		.split(".")
		.map((n) => Number(n) || 0);
	if (majI > majR) return true;
	if (majI < majR) return false;
	if (minI > minR) return true;
	if (minI < minR) return false;
	return patI >= patR;
}

export async function runDoctor(pi: ExtensionAPI, cwd?: string): Promise<Check[]> {
	const checks: Check[] = [];

	// 1. glab installation and version
	try {
		const { stdout } = await pi.exec("glab", ["--version"]);
		const versionMatch = stdout.match(/glab version ([\d.]+)/);
		if (!versionMatch) {
			checks.push({
				label: "glab CLI",
				status: "fail",
				detail: `Unexpected --version output: ${stdout.trim()}`,
			});
		} else {
			const installed = versionMatch[1];
			const ok = versionSatisfies(installed, MIN_GLAB_VERSION);
			checks.push({
				label: "glab CLI version",
				status: ok ? "pass" : "fail",
				detail: ok
					? `glab ${installed} (meets minimum ${MIN_GLAB_VERSION})`
					: `glab ${installed} — below minimum ${MIN_GLAB_VERSION}. Run: brew upgrade glab`,
			});
		}
	} catch {
		checks.push({
			label: "glab CLI",
			status: "fail",
			detail: `glab not found in PATH. Install from: https://gitlab.com/gitlab-org/cli#installation`,
		});
	}

	// 2. glab authentication
	try {
		const { stdout, code } = await pi.exec("glab", ["auth", "status"]);
		if (code === 0) {
			checks.push({
				label: "glab auth",
				status: "pass",
				detail: stdout.trim().split("\n")[0] ?? "Authenticated",
			});
		} else {
			checks.push({
				label: "glab auth",
				status: "fail",
				detail: "Not authenticated. Run `glab auth login` to authenticate.",
			});
		}
	} catch (err) {
		checks.push({
			label: "glab auth",
			status: "fail",
			detail: `glab auth status check failed: ${String(err)}`,
		});
	}

	// 3. API connectivity
	const apiHost = getApiHost();
	try {
		const { code, stderr } = await pi.exec("glab", [
			"api",
			"version",
			"--hostname",
			apiHost,
		]);
		if (code === 0) {
			checks.push({
				label: `GitLab API (${apiHost})`,
				status: "pass",
				detail: `API is reachable at ${apiHost}`,
			});
		} else {
			checks.push({
				label: `GitLab API (${apiHost})`,
				status: "fail",
				detail: `API request failed: ${stderr.trim()}`,
			});
		}
	} catch (err) {
		checks.push({
			label: `GitLab API (${apiHost})`,
			status: "fail",
			detail: `Could not reach ${apiHost}: ${String(err)}`,
		});
	}

	// 4. Config in prime-settings.json
	ensureConfig();
	const setupStatus = checkSetup(cwd);
	const hasToken = !setupStatus.missingToken;
	const hasExplicitConfig = !setupStatus.missingConfig;

	checks.push({
		label: "pi-gitlab config (prime-settings.json)",
		status: hasToken ? "pass" : "fail",
		detail: hasToken
			? `Token sourced from ${setupStatus.config.tokenEnv} environment variable`
			: `No token found. Set ${setupStatus.config.tokenEnv} or configure pi-gitlab.token in prime-settings.json. Target host: ${setupStatus.config.hostname}`,
	});

	checks.push({
		label: "pi-gitlab config key",
		status: hasExplicitConfig ? "pass" : "fail",
		detail: hasExplicitConfig
			? "pi-gitlab configuration found in prime-settings.json"
			: "Missing pi-gitlab configuration in prime-settings.json. Run the setup wizard or manually add the pi-gitlab key before using tools.",
	});

	// 5. Overall status
	checks.push({
		label: "pi-gitlab ready",
		status: setupStatus.ready ? "pass" : "fail",
		detail: setupStatus.ready
			? "All checks passed — pi-gitlab tools are available."
			: "Configuration incomplete — pi-gitlab tools will return a setup error until resolved.",
	});

	return checks;
}

/** Command handler — pi is passed via closure from the registerCall in index.ts */
export async function gitlabDoctorCommand(
	_args: unknown,
	ctx: ExtensionContext,
	pi: ExtensionAPI,
): Promise<void> {
	const checks = await runDoctor(pi, ctx.cwd);

	const lines: string[] = [];
	for (const check of checks) {
		const icon =
			check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
		lines.push(`${icon} **${check.label}**\n   ${check.detail}`);
	}

	ctx.ui.notify(lines.join("\n\n"), "info");
}
