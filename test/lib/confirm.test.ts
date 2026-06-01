import { describe, it, expect } from "vitest";
import { requireConfirm } from "../../src/lib/confirm.js";

describe("requireConfirm", () => {
	it("returns null when confirm is true", () => {
		const result = requireConfirm("test", { confirm: true, dryRun: false });
		expect(result).toBeNull();
	});

	it("returns preview when dryRun is true", () => {
		const result = requireConfirm("test", { confirm: false, dryRun: true });
		expect(result).not.toBeNull();
		expect(result?.details.dryRun).toBe(true);
	});

	it("returns error when neither confirm nor dryRun", () => {
		const result = requireConfirm("test", { confirm: false, dryRun: false });
		expect(result).not.toBeNull();
		expect(result?.details.error).toBe("confirmation_required");
	});
});
