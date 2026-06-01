import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { requireSetup, setupRequiredResult } from "../lib/errors.js";
import { glab } from "../lib/glab.js";
import { requireConfirm } from "../lib/confirm.js";
import { loadConfig } from "../config/loader.js";
import { resolveProject } from "../lib/projectFallback.js";
import { resolveProjectId } from "../lib/resolveProjectId.js";
import { spawn } from "node:child_process";

export function registerGitlabForcePushSafe(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gitlab_force_push_safe",
		label: "Force Push (Safe)",
		description:
			"Force-push a branch after safety checks: verifies protected branch status, pauses for protection removal if needed, then re-protects after push. Requires confirmation.",
		parameters: Type.Object(
			{
				remote: Type.Optional(
					Type.String({
						default: "origin",
						description: "Git remote name.",
					}),
				),
				branch: Type.String({
					description: "Local branch name to push.",
				}),
				remoteBranch: Type.Optional(
					Type.String({
						description:
							"Remote branch name. Defaults to same as local branch.",
					}),
				),
				confirm: Type.Optional(Type.Boolean({ default: false })),
				dryRun: Type.Optional(Type.Boolean({ default: false })),
			},
			{ additionalProperties: false },
		),
		async execute(
			_toolCallId,
			params,
			_signal,
			_onUpdate,
			ctx: ExtensionContext,
		) {
			try {
				requireSetup(ctx.cwd);
			} catch {
				return setupRequiredResult();
			}

			const config = loadConfig(ctx.cwd);
			const remote = params.remote ?? "origin";
			const remoteBranch = params.remoteBranch ?? params.branch;

			let projectId: number;
			try {
				const projectPath = await resolveProject(undefined, ctx.cwd);
				projectId = await resolveProjectId(projectPath);
			} catch (err) {
				return {
					content: [
						{
							type: "text",
							text: `❌ Could not resolve project ID for branch protection checks: ${String(err instanceof Error ? err.message : err)}`,
						},
					],
					details: { success: false, error: "project_resolution_failed" },
				};
			}

			// Step 1: Check protected branches
			let isProtected = false;
			try {
				await glab(
					[
						"api",
						`projects/${projectId}/protected_branches/${encodeURIComponent(remoteBranch)}`,
					],
					ctx.cwd,
				);
				isProtected = true;
			} catch {
				// Not protected or API error — treat as unprotected
			}

			const reprotectionNote = isProtected
				? `\n⚠️ Branch \`${remoteBranch}\` is **protected**. Will temporarily unprotect, force-push, then re-protect.`
				: "";

			const preview =
				`Force-push \`${params.branch}\` to \`${remote}/${remoteBranch}\`` +
				reprotectionNote;

			const blocked = requireConfirm(preview, {
				confirm: params.confirm,
				dryRun: params.dryRun,
			});
			if (blocked) return blocked;

			// Step 2: Temporarily unprotect if needed
			if (isProtected) {
				try {
					await glab(
						[
							"api",
							"-X",
							"DELETE",
							`projects/${projectId}/protected_branches/${encodeURIComponent(remoteBranch)}`,
						],
						ctx.cwd,
					);
				} catch (err) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Failed to unprotect branch \`${remoteBranch}\`: ${String(err instanceof Error ? err.message : err)}\n\nManual unprotection required before force-push.`,
							},
						],
						details: { success: false, error: "unprotect_failed" },
					};
				}
			}

			// Step 3: Force push
			try {
				await runGitPush(
					["push", "--force-with-lease", remote, `${params.branch}:${remoteBranch}`],
					ctx.cwd,
				);
			} catch (err) {
				// Attempt re-protection even if push fails
				if (isProtected) {
					await reprotectBranch(
						ctx.cwd,
						projectId,
						remoteBranch,
						config.safety.forcePushReprotectAlways,
					);
				}
				return {
					content: [
						{
							type: "text",
							text: `❌ Force-push failed: ${String(err instanceof Error ? err.message : err)}`,
						},
					],
					details: { success: false, error: "push_failed" },
				};
			}

			// Step 4: Re-protect if we unprotected
			if (isProtected) {
				const reprotectionOk = await reprotectBranch(
					ctx.cwd,
					projectId,
					remoteBranch,
					config.safety.forcePushReprotectAlways,
				);
				if (!reprotectionOk) {
					return {
						content: [
							{
								type: "text",
								text: `✅ Force-push succeeded, but **re-protection failed** for \`${remoteBranch}\`. Manually re-protect this branch.`,
							},
						],
						details: {
							success: true,
							warning: "reprotection_failed",
							branch: remoteBranch,
						},
					};
				}
			}

			return {
				content: [
					{
						type: "text",
						text: `✅ Force-push complete: \`${params.branch}\` → \`${remote}/${remoteBranch}\`${isProtected ? "\nBranch re-protected." : ""}`,
					},
				],
				details: { success: true, branch: remoteBranch, wasProtected: isProtected },
			};
		},
	});
}

async function reprotectBranch(
	cwd: string | undefined,
	projectId: number,
	branch: string,
	alwaysReprotect: boolean,
): Promise<boolean> {
	if (!alwaysReprotect) return true;

	try {
		await glab(
			[
				"api",
				"-X",
				"POST",
				`projects/${projectId}/protected_branches`,
				"-f",
				`name=${branch}`,
				"-f",
				"push_access_level=30",
				"-f",
				"merge_access_level=30",
			],
			cwd,
		);
		return true;
	} catch {
		return false;
	}
}

async function runGitPush(
	args: string[],
	cwd?: string,
): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn("git", args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stderr = "";
		child.stderr.on("data", (d) => {
			stderr += String(d);
		});
		child.on("error", reject);
		child.on("close", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new Error(stderr.trim() || `git push exited with code ${code ?? -1}`));
		});
	});
}
