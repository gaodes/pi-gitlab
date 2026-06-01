import { loadConfig } from "../config/loader.js";
import { getGitRemoteProjectPath } from "./gitRemoteParse.js";

export async function resolveProject(
	project?: string,
	cwd?: string,
): Promise<string> {
	if (project) return project;

	const gitPath = await getGitRemoteProjectPath(cwd);
	if (gitPath) return gitPath;

	const config = loadConfig(cwd);
	if (config.defaultProjectPath) return config.defaultProjectPath;

	throw new Error(
		"No project specified and could not determine default from git remote or settings.",
	);
}
