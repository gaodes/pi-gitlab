import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts", "src/**/*.test.ts"],
		exclude: ["_phase2/**", "node_modules/**"],
	},
});
