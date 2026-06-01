import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function glab(args: string[], cwd?: string): Promise<unknown> {
	try {
		const { stdout, stderr } = await execFileAsync("glab", args, {
			cwd,
			encoding: "utf-8",
			maxBuffer: 10 * 1024 * 1024,
			env: process.env,
		});

		if (stderr?.trim() && !stdout.trim()) {
			throw new Error(stderr.trim());
		}

		const text = stdout.trim();
		if (!text) return {};
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	} catch (err: any) {
		const message =
			err?.stderr || err?.stdout || err?.message || "glab command failed";
		throw new Error(String(message).trim());
	}
}
