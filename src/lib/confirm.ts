/**
 * Confirmation UX for mutating tools.
 *
 * Pattern:
 *   1. Tool builds a preview string describing the mutation.
 *   2. If `dryRun: true` → return preview only.
 *   3. If `confirm: true` → execute the mutation.
 *   4. Otherwise → return an error asking the user to set `confirm: true`.
 */

export interface ConfirmResult {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
}

export function requireConfirm(
	preview: string,
	params: { dryRun?: boolean; confirm?: boolean },
): ConfirmResult | null {
	if (params.dryRun) {
		return {
			content: [
				{
					type: "text",
					text: `🔍 Preview\n\n${preview}\n\n_Set \`confirm: true\` to execute._`,
				},
			],
			details: { success: true, preview, dryRun: true },
		};
	}

	if (!params.confirm) {
		return {
			content: [
				{
					type: "text",
					text:
						`⚠️ Mutating operation requires confirmation.\n\n${preview}\n\n` +
						`Set \`confirm: true\` to proceed, or \`dryRun: true\` to preview only.`,
				},
			],
			details: { success: false, error: "confirmation_required", preview },
		};
	}

	return null;
}
