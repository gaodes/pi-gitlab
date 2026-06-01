import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PiGitlabConfig } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

const GLOBAL_SETTINGS_PATH = join(
	homedir(),
	".pi",
	"agent",
	"prime-settings.json",
);

function cloneDefaults(): PiGitlabConfig {
	return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as PiGitlabConfig;
}

function applyOverlay(
	base: PiGitlabConfig,
	overlay: Record<string, unknown>,
): void {
	if (typeof overlay.hostname === "string")
		base.hostname = overlay.hostname as string;
	if (typeof overlay.sshHostname === "string")
		base.sshHostname = overlay.sshHostname as string;
	if (typeof overlay.sshPort === "number")
		base.sshPort = overlay.sshPort as number;
	if (typeof overlay.apiBase === "string")
		base.apiBase = overlay.apiBase as string;
	if (overlay.tokenRef !== undefined)
		base.tokenRef = overlay.tokenRef as string | null;
	if (typeof overlay.tokenEnv === "string")
		base.tokenEnv = overlay.tokenEnv as string;
	if (
		typeof overlay.defaultProjectId === "number" ||
		overlay.defaultProjectId === null
	)
		base.defaultProjectId = overlay.defaultProjectId as number | null;
	if (
		typeof overlay.defaultProjectPath === "string" ||
		overlay.defaultProjectPath === null
	)
		base.defaultProjectPath = overlay.defaultProjectPath as string | null;
	if (overlay.render && typeof overlay.render === "object") {
		const r = overlay.render as Record<string, unknown>;
		if (typeof r.tableMaxRows === "number")
			base.render.tableMaxRows = r.tableMaxRows as number;
		if (typeof r.diffMaxLines === "number")
			base.render.diffMaxLines = r.diffMaxLines as number;
		if (typeof r.logTailLines === "number")
			base.render.logTailLines = r.logTailLines as number;
	}
	if (overlay.safety && typeof overlay.safety === "object") {
		const s = overlay.safety as Record<string, unknown>;
		if (typeof s.requireConfirmForDelete === "boolean")
			base.safety.requireConfirmForDelete =
				s.requireConfirmForDelete as boolean;
		if (typeof s.previewMutatingApiCalls === "boolean")
			base.safety.previewMutatingApiCalls =
				s.previewMutatingApiCalls as boolean;
		if (typeof s.redactJobLogsByDefault === "boolean")
			base.safety.redactJobLogsByDefault = s.redactJobLogsByDefault as boolean;
		if (typeof s.forcePushReprotectAlways === "boolean")
			base.safety.forcePushReprotectAlways =
				s.forcePushReprotectAlways as boolean;
		if (typeof s.minGlabVersion === "string")
			base.safety.minGlabVersion = s.minGlabVersion as string;
	}
}

export function loadConfig(cwd?: string): PiGitlabConfig {
	const base = cloneDefaults();

	if (existsSync(GLOBAL_SETTINGS_PATH)) {
		try {
			const raw = readFileSync(GLOBAL_SETTINGS_PATH, "utf-8");
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			if (parsed["pi-gitlab"] && typeof parsed["pi-gitlab"] === "object") {
				applyOverlay(base, parsed["pi-gitlab"] as Record<string, unknown>);
			}
		} catch {
			// malformed file — keep defaults
		}
	}

	if (cwd) {
		const projectSettings = join(cwd, ".pi", "prime-settings.json");
		if (existsSync(projectSettings)) {
			try {
				const raw = readFileSync(projectSettings, "utf-8");
				const parsed = JSON.parse(raw) as Record<string, unknown>;
				if (parsed["pi-gitlab"] && typeof parsed["pi-gitlab"] === "object") {
					applyOverlay(base, parsed["pi-gitlab"] as Record<string, unknown>);
				}
			} catch {
				// malformed project overlay — ignored
			}
		}
	}

	return base;
}

export function ensureConfig(): void {
	if (existsSync(GLOBAL_SETTINGS_PATH)) {
		try {
			const raw = readFileSync(GLOBAL_SETTINGS_PATH, "utf-8");
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			if (parsed["pi-gitlab"] !== undefined) return;
		} catch {
			// malformed file — fall through to rewrite
		}
	}

	const defaults = cloneDefaults();
	const existing: Record<string, unknown> = existsSync(GLOBAL_SETTINGS_PATH)
		? (JSON.parse(readFileSync(GLOBAL_SETTINGS_PATH, "utf-8")) as Record<
				string,
				unknown
			>)
		: {};

	const seed: Record<string, unknown> = {
		...existing,
		"pi-gitlab": {
			hostname: defaults.hostname,
			sshHostname: defaults.sshHostname,
			sshPort: defaults.sshPort,
			apiBase: defaults.apiBase,
			tokenRef: defaults.tokenRef,
			tokenEnv: defaults.tokenEnv,
			defaultProjectId: defaults.defaultProjectId,
			defaultProjectPath: defaults.defaultProjectPath,
			render: { ...defaults.render },
			safety: { ...defaults.safety },
		},
	};

	try {
		const dir = join(homedir(), ".pi", "agent");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			GLOBAL_SETTINGS_PATH,
			`${JSON.stringify(seed, null, 2)}\n`,
			"utf-8",
		);
	} catch (err) {
		console.error("[pi-gitlab] Failed to seed prime-settings.json:", err);
	}
}

export { GLOBAL_SETTINGS_PATH };
