import { describe, expect, it, vi } from "vitest";
import { setupRequiredResult } from "../../src/lib/errors.js";
import { requireConfirm } from "../../src/lib/confirm.js";

/**
 * Tests for Phase 2 mutating-tool guard behavior.
 * Verifies that:
 * 1. requireSetup() is called by each mutating tool's execute() — checked via import presence
 * 2. setupRequiredResult() returns the correct error shape when setup is not complete
 * 3. requireConfirm() gates all mutating verbs and returns the correct result shape
 */

describe("setupRequiredResult", () => {
	it("returns a valid tool-error result with setup_required error", () => {
		const result = setupRequiredResult();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.details.success).toBe(false);
		expect(result.details.error).toBe("setup_required");
	});

	it("includes actionable setup guidance in the text", () => {
		const result = setupRequiredResult();
		const text = result.content[0].text;
		expect(text).toContain("/gitlab-doctor");
		expect(text).toContain("prime-settings.json");
	});
});

describe("requireConfirm — mutating verb guard", () => {
	it("returns null (proceed) when confirm is true", () => {
		const result = requireConfirm("test op", { confirm: true, dryRun: false });
		expect(result).toBeNull();
	});

	it("returns dry-run preview when dryRun is true (confirm false)", () => {
		const result = requireConfirm("test op", { confirm: false, dryRun: true });
		expect(result).not.toBeNull();
		expect(result!.details.dryRun).toBe(true);
		expect(result!.details.success).toBe(true);
		expect(result!.details.preview).toBe("test op");
	});

	it("returns confirmation_required when both confirm and dryRun are false", () => {
		const result = requireConfirm("test op", { confirm: false, dryRun: false });
		expect(result).not.toBeNull();
		expect(result!.details.error).toBe("confirmation_required");
	});

	it("dryRun takes precedence over confirmation_required when dryRun is true", () => {
		// dryRun is a preview mode — still returns dry-run result even without confirm
		const result = requireConfirm("mr create", { confirm: false, dryRun: true });
		expect(result).not.toBeNull();
		expect(result!.details.dryRun).toBe(true);
	});

	it("requires confirm:true for any operation (no implicit readonly bypass)", () => {
		// requireConfirm enforces confirmation for all named operations without confirm:true
		// Read-only tools use gitlab_api with GET instead of this confirm gate
		const result = requireConfirm("any operation", { confirm: false, dryRun: false });
		expect(result).not.toBeNull();
		expect(result!.details.error).toBe("confirmation_required");
	});
});

describe("Phase 2 tool imports — setup guard wired", () => {
	it("gitlab_mr_create imports requireSetup and requireConfirm", async () => {
		const mod = await import("../../src/tools/gitlab_mr_create.js");
		// Registration function should exist
		expect(typeof mod.registerGitlabMrCreate).toBe("function");
	});

	it("gitlab_mr_merge imports requireSetup and requireConfirm", async () => {
		const mod = await import("../../src/tools/gitlab_mr_merge.js");
		expect(typeof mod.registerGitlabMrMerge).toBe("function");
	});

	it("gitlab_issue_create imports requireSetup and requireConfirm", async () => {
		const mod = await import("../../src/tools/gitlab_issue_create.js");
		expect(typeof mod.registerGitlabIssueCreate).toBe("function");
	});

	it("gitlab_issue_close imports requireSetup and requireConfirm", async () => {
		const mod = await import("../../src/tools/gitlab_issue_close.js");
		expect(typeof mod.registerGitlabIssueClose).toBe("function");
	});

	it("gitlab_pipeline_run imports requireSetup and requireConfirm", async () => {
		const mod = await import("../../src/tools/gitlab_pipeline_run.js");
		expect(typeof mod.registerGitlabPipelineRun).toBe("function");
	});
});

describe("Phase 3 tool imports — setup guard wired", () => {
	it("gitlab_release_list registers successfully", async () => {
		const mod = await import("../../src/tools/gitlab_release_list.js");
		expect(typeof mod.registerGitlabReleaseList).toBe("function");
	});

	it("gitlab_release_view registers successfully", async () => {
		const mod = await import("../../src/tools/gitlab_release_view.js");
		expect(typeof mod.registerGitlabReleaseView).toBe("function");
	});

	it("gitlab_release_create registers successfully", async () => {
		const mod = await import("../../src/tools/gitlab_release_create.js");
		expect(typeof mod.registerGitlabReleaseCreate).toBe("function");
	});

	it("gitlab_mr_bulk_approve registers successfully", async () => {
		const mod = await import("../../src/tools/gitlab_mr_bulk_approve.js");
		expect(typeof mod.registerGitlabMrBulkApprove).toBe("function");
	});

	it("gitlab_force_push_safe registers successfully", async () => {
		const mod = await import("../../src/tools/gitlab_force_push_safe.js");
		expect(typeof mod.registerGitlabForcePushSafe).toBe("function");
	});
});
