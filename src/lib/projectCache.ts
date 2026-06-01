import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ProjectCache } from "../config/types.js";

const CACHE_DIR = join(homedir(), ".pi", "agent", "cache", "pi-gitlab");
const CACHE_PATH = join(CACHE_DIR, "projects.json");

function readCache(): ProjectCache {
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
