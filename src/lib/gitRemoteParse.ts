import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getGitRemoteProjectPath(
	cwd?: string,
): Promise<string | undefined> {
	try {
		const { stdout } = await execFileAsync(
			"git",
			["remote", "get-url", "origin"],
			{ cwd },
		);
		return parseGitUrl(stdout.trim());
	} catch {
		return undefined;
	}
}

export function parseGitUrl(url: string): string | undefined {
	if (url.startsWith("git@")) {
		const idx = url.indexOf(":");
		if (idx === -1) return undefined;
		let path = url.slice(idx + 1);
		// Strip SSH port prefix if present: git@host:2222/path
		if (/^\d+\//.test(path)) {
			path = path.replace(/^\d+\//, "");
		}
		return path.replace(/\.git$/, "");
	}
	if (url.startsWith("http")) {
		try {
			const u = new URL(url);
			return u.pathname.replace(/^\//, "").replace(/\.git$/, "");
		} catch {
			return undefined;
		}
	}
	return undefined;
}
