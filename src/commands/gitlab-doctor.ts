/**
 * /gitlab-doctor — diagnostics and interactive setup for pi-gitlab.
 */

import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { checkSetup } from "../config/guard.js";
import { loadConfig, writeConfig } from "../config/loader.js";
import { getApiHost } from "../lib/env.js";

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

	try {
		const { stdout } = await pi.exec("glab", ["--version"]);
		const versionMatch = stdout.match(/glab ([\d.]+)/);
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
			detail: "glab not found in PATH. Install from: https://gitlab.com/gitlab-org/cli#installation",
		});
	}

	try {
		const { stdout, code } = await pi.exec("glab", ["auth", "status"]);
		checks.push({
			label: "glab auth",
			status: code === 0 ? "pass" : "fail",
			detail:
				code === 0
					? (stdout.trim().split("\n")[0] ?? "Authenticated")
					: "Not authenticated. Run `glab auth login` to authenticate.",
		});
	} catch (err) {
		checks.push({
			label: "glab auth",
			status: "fail",
			detail: `glab auth status check failed: ${String(err)}`,
		});
	}

	const apiHost = getApiHost();
	try {
		const { code, stderr } = await pi.exec("glab", [
			"api",
			"version",
			"--hostname",
			apiHost,
		]);
		checks.push({
			label: `GitLab API (${apiHost})`,
			status: code === 0 ? "pass" : "fail",
			detail:
				code === 0
					? `API is reachable at ${apiHost}`
					: `API request failed: ${stderr.trim()}`,
		});
	} catch (err) {
		checks.push({
			label: `GitLab API (${apiHost})`,
			status: "fail",
			detail: `Could not reach ${apiHost}: ${String(err)}`,
		});
	}

	const setupStatus = checkSetup(cwd);
	const hasToken = !setupStatus.missingToken;
	const hasExplicitConfig = !setupStatus.missingConfig;

	checks.push({
		label: "pi-gitlab token",
		status: hasToken ? "pass" : "fail",
		detail: hasToken
			? `Token sourced from ${setupStatus.config.tokenEnv} environment variable`
			: `No token found. Set ${setupStatus.config.tokenEnv} in your shell or .env.1pass.`,
	});

	checks.push({
		label: "pi-gitlab config key",
		status: hasExplicitConfig ? "pass" : "fail",
		detail: hasExplicitConfig
			? "pi-gitlab configuration key found in prime-settings.json"
			: "Missing pi-gitlab configuration key in prime-settings.json",
	});

	checks.push({
		label: "pi-gitlab ready",
		status: setupStatus.ready ? "pass" : "fail",
		detail: setupStatus.ready
			? "All checks passed — pi-gitlab tools are available."
			: "Configuration incomplete — tools remain blocked until setup completes.",
	});

	return checks;
}

async function runSetupWizard(ctx: ExtensionContext): Promise<boolean> {
	const current = loadConfig(ctx.cwd);
	const proceed = await ctx.ui.confirm(
		"Run pi-gitlab setup wizard?",
		"pi-gitlab tools are blocked until config + token are valid. Start guided setup now?",
	);
	if (!proceed) return false;

	const hostname =
		(await ctx.ui.input("GitLab hostname", current.hostname)) ?? current.hostname;
	const sshHostname =
		(await ctx.ui.input("GitLab SSH hostname", current.sshHostname)) ??
		current.sshHostname;
	const sshPortRaw =
		(await ctx.ui.input("GitLab SSH port", String(current.sshPort))) ??
		String(current.sshPort);
	const tokenEnv =
		(await ctx.ui.input("Token environment variable name", current.tokenEnv)) ??
		current.tokenEnv;
	const defaultProjectPathInput =
		(await ctx.ui.input(
			"Default project path (optional)",
			current.defaultProjectPath ?? "",
		)) ?? "";

	const sshPort = Number(sshPortRaw);
	if (!Number.isInteger(sshPort) || sshPort <= 0) {
		ctx.ui.notify("Invalid SSH port. Setup cancelled.", "error");
		return false;
	}

	const defaultProjectPath = defaultProjectPathInput.trim() || null;

	const confirm = await ctx.ui.confirm(
		"Save pi-gitlab configuration?",
		`Host: ${hostname}\nSSH: ${sshHostname}:${sshPort}\nToken env: ${tokenEnv}\nDefault project: ${defaultProjectPath ?? "(none)"}`,
	);
	if (!confirm) return false;

	writeConfig({
		hostname,
		sshHostname,
		sshPort,
		tokenEnv,
		defaultProjectPath,
	});

	ctx.ui.notify("Saved pi-gitlab configuration to global prime-settings.json", "info");

	if (!process.env[tokenEnv] || process.env[tokenEnv]?.trim().length === 0) {
		ctx.ui.notify(
			`Token variable ${tokenEnv} is not set in the current environment. Set it (or load via .env.1pass) before using tools.`,
			"warning",
		);
	}

	return true;
}

export async function gitlabDoctorCommand(
	_args: unknown,
	ctx: ExtensionContext,
	pi: ExtensionAPI,
): Promise<void> {
	let checks = await runDoctor(pi, ctx.cwd);
	let status = checkSetup(ctx.cwd);

	if (!status.ready) {
		const configured = await runSetupWizard(ctx);
		if (configured) {
			checks = await runDoctor(pi, ctx.cwd);
			status = checkSetup(ctx.cwd);
		}
	}

	const lines: string[] = [];
	for (const check of checks) {
		const icon =
			check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
		lines.push(`${icon} **${check.label}**\n   ${check.detail}`);
	}

	if (!status.ready) {
		lines.push(
			"\n⚠️ **Setup incomplete**\n   Tools remain blocked until both token and `pi-gitlab` config are valid.",
		);
	}

	ctx.ui.notify(lines.join("\n\n"), "info");
}
