import { describe, it, expect } from "vitest";
import { parseGitUrl } from "../../src/lib/gitRemoteParse.js";

describe("parseGitUrl", () => {
	it("parses SSH URL with port", () => {
		const result = parseGitUrl("git@gitlab-ssh.elches.dev:2222/agents/primecodex/packages/pi-gitlab.git");
		expect(result).toBe("agents/primecodex/packages/pi-gitlab");
	});

	it("parses SSH URL without port", () => {
		const result = parseGitUrl("git@gitlab.com:user/repo.git");
		expect(result).toBe("user/repo");
	});

	it("parses HTTPS URL", () => {
		const result = parseGitUrl("https://gitlab.elches.dev/agents/primecodex/packages/pi-gitlab.git");
		expect(result).toBe("agents/primecodex/packages/pi-gitlab");
	});

	it("returns undefined for invalid URL", () => {
		const result = parseGitUrl("not-a-url");
		expect(result).toBeUndefined();
	});
});
