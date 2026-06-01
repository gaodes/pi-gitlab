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

	// Auto-derive apiBase from hostname if not explicitly set
	if (base.hostname && !base.apiBase) {
		base.apiBase = `https://${base.hostname}/api/v4`;
	}

	return base;
}

function readGlobalSettings(): Record<string, unknown> {
	if (!existsSync(GLOBAL_SETTINGS_PATH)) return {};
	try {
		return JSON.parse(readFileSync(GLOBAL_SETTINGS_PATH, "utf-8")) as Record<
			string,
			unknown
		>;
	} catch {
		return {};
	}
}

function writeGlobalSettings(payload: Record<string, unknown>): void {
	const dir = join(homedir(), ".pi", "agent");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		GLOBAL_SETTINGS_PATH,
		`${JSON.stringify(payload, null, 2)}\n`,
		"utf-8",
	);
}

export function ensureConfig(): void {
	const existing = readGlobalSettings();
	if (existing["pi-gitlab"] !== undefined) return;

	const defaults = cloneDefaults();
	writeGlobalSettings({
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
	});
}

export function writeConfig(
	overrides: Partial<PiGitlabConfig>,
): PiGitlabConfig {
	const existing = readGlobalSettings();
	const base = cloneDefaults();
	if (existing["pi-gitlab"] && typeof existing["pi-gitlab"] === "object") {
		applyOverlay(base, existing["pi-gitlab"] as Record<string, unknown>);
	}

	const merged: PiGitlabConfig = {
		...base,
		...overrides,
		render: { ...base.render, ...(overrides.render ?? {}) },
		safety: { ...base.safety, ...(overrides.safety ?? {}) },
	};

	// Auto-derive apiBase from hostname if not explicitly set
	if (merged.hostname && !merged.apiBase) {
		merged.apiBase = `https://\${merged.hostname}/api/v4`;
	}

	writeGlobalSettings({
		...existing,
		"pi-gitlab": merged,
	});

	return merged;
}

export { GLOBAL_SETTINGS_PATH };
