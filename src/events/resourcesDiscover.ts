/**
 * resources_discover handler for pi-gitlab.
 *
 * Registers the package's in-package skills directory so Pi's skill
 * system discovers and exposes them.
 *
 * Skills live at `<package-root>/skills/` and are discovered from there.
 * Each skill directory contains a SKILL.md with YAML frontmatter.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolve the skills/ directory path relative to the package root. */
export function getSkillsDir(): string {
	// src/events/resourcesDiscover.ts → package root
	const extensionDir = path.dirname(fileURLToPath(import.meta.url));
	const packageRoot = path.join(extensionDir, "..", "..");
	return path.join(packageRoot, "skills");
}

/** Return value for the resources_discover event — exposes skillPaths to Pi. */
export function registerResourcesDiscover(): { skillPaths: string[] } {
	return {
		skillPaths: [getSkillsDir()],
	};
}
