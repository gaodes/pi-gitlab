import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ProjectCache } from "../config/types.js";

const CACHE_DIR = join(homedir(), ".pi", "agent", ".cache", "pi-gitlab");
const CACHE_PATH = join(CACHE_DIR, "projects.json");
const OLD_CACHE_DIR = join(homedir(), ".pi", "agent", "cache", "pi-gitlab");
const OLD_CACHE_PATH = join(OLD_CACHE_DIR, "projects.json");

/** One-time migration from old cache path to .cache */
function migrateOldCache(): void {
	if (!existsSync(OLD_CACHE_PATH) || existsSync(CACHE_PATH)) return;
	mkdirSync(CACHE_DIR, { recursive: true });
	try {
		const raw = readFileSync(OLD_CACHE_PATH, "utf-8");
		const cache = JSON.parse(raw) as ProjectCache;
		writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
	} catch {
		// If old cache is corrupt, skip migration
	}
}

function readCache(): ProjectCache {
	migrateOldCache();
	if (!existsSync(CACHE_PATH)) {
		return { version: 1, entries: {} };
	}
	try {
		const raw = readFileSync(CACHE_PATH, "utf-8");
		return JSON.parse(raw) as ProjectCache;
	} catch {
		return { version: 1, entries: {} };
	}
}

function writeCache(cache: ProjectCache): void {
	mkdirSync(CACHE_DIR, { recursive: true });
	writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

export function getCachedId(pathWithNamespace: string): number | undefined {
	const cache = readCache();
	return cache.entries[pathWithNamespace]?.id;
}

export function setCachedId(pathWithNamespace: string, id: number): void {
	const cache = readCache();
	cache.entries[pathWithNamespace] = {
		id,
		pathWithNamespace,
		resolvedAt: new Date().toISOString(),
	};
	writeCache(cache);
}
