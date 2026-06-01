import { glab } from "./glab.js";
import { getCachedId, setCachedId } from "./projectCache.js";

export async function resolveProjectId(
	project: string,
	force = false,
): Promise<number> {
	const numeric = Number(project);
	if (!Number.isNaN(numeric) && numeric > 0) {
		try {
			await glab(["api", `projects/${numeric}`]);
			return numeric;
		} catch {
			throw new Error(`Project ID ${numeric} not found or not accessible.`);
		}
	}

	if (!force) {
		const cached = getCachedId(project);
		if (cached) return cached;
	}

	const lastSegment = project.split("/").pop() ?? project;
	const results = (await glab([
		"api",
		"--paginate",
		`projects?search=${encodeURIComponent(lastSegment)}&per_page=100`,
	])) as Array<{ id: number; path_with_namespace: string }>;

	const match = results.find((r) => r.path_with_namespace === project);
	if (!match) {
		throw new Error(`Project '${project}' not found.`);
	}

	setCachedId(project, match.id);
	return match.id;
}
