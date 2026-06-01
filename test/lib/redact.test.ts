import { describe, it, expect } from "vitest";
import { redact } from "../../src/lib/redact.js";

describe("redact", () => {
	it("redacts tokens", () => {
		const text = "auth token=secret123 value";
		expect(redact(text)).toBe("auth token=***REDACTED*** value");
	});

	it("redacts Bearer tokens", () => {
		const text = "Authorization: Bearer abc123";
		expect(redact(text)).toBe("Authorization: Bearer ***REDACTED***");
	});

	it("redacts passwords", () => {
		const text = "password=mysecret";
		expect(redact(text)).toBe("password=***REDACTED***");
	});

	it("redacts GLAB tokens", () => {
		const text = "token glpat-xxxxxxxxxxxxxxxxxxxx";
		expect(redact(text)).toBe("token ***REDACTED***");
	});

	it("leaves safe text unchanged", () => {
		const text = "Hello world, this is safe text.";
		expect(redact(text)).toBe(text);
	});
});
