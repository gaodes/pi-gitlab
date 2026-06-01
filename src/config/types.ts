/** Config shape for the pi-gitlab key in prime-settings.json */
export interface PiGitlabConfig {
	hostname: string;
	sshHostname: string;
	sshPort: number;
	apiBase: string;
	tokenRef: string | null;
	tokenEnv: string;
	defaultProjectId: number | null;
	defaultProjectPath: string | null;
	render: {
		tableMaxRows: number;
		diffMaxLines: number;
		logTailLines: number;
	};
	safety: {
		requireConfirmForDelete: boolean;
		previewMutatingApiCalls: boolean;
		redactJobLogsByDefault: boolean;
		forcePushReprotectAlways: boolean;
		minGlabVersion: string;
	};
}

export const DEFAULT_CONFIG: PiGitlabConfig = {
	hostname: "gitlab.elches.dev",
	sshHostname: "gitlab-ssh.elches.dev",
	sshPort: 2222,
	apiBase: "https://gitlab.elches.dev/api/v4",
	tokenRef: null,
	tokenEnv: "PI_GITLAB_TOKEN",
	defaultProjectId: null,
	defaultProjectPath: null,
	render: {
		tableMaxRows: 25,
		diffMaxLines: 400,
		logTailLines: 200,
	},
	safety: {
		requireConfirmForDelete: true,
		previewMutatingApiCalls: true,
		redactJobLogsByDefault: true,
		forcePushReprotectAlways: true,
		minGlabVersion: "1.40.0",
	},
};

export interface ProjectCacheEntry {
	id: number;
	pathWithNamespace: string;
	resolvedAt: string;
}

export interface ProjectCache {
	version: 1;
	entries: Record<string, ProjectCacheEntry>;
}
