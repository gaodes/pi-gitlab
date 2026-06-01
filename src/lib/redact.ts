const PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
	{ regex: /token=[\w-]+/gi, replacement: "token=***REDACTED***" },
	{ regex: /Bearer\s+[\w-]+/gi, replacement: "Bearer ***REDACTED***" },
	{ regex: /password=[^\s&]+/gi, replacement: "password=***REDACTED***" },
	{ regex: /secret=[^\s&]+/gi, replacement: "secret=***REDACTED***" },
	{ regex: /key=[A-Za-z0-9+/=]{20,}/gi, replacement: "key=***REDACTED***" },
	{
		regex: /AWS_ACCESS_KEY_ID=[A-Z0-9]{20}/gi,
		replacement: "AWS_ACCESS_KEY_ID=***REDACTED***",
	},
	{
		regex: /AWS_SECRET_ACCESS_KEY=[A-Za-z0-9/+=]{40}/gi,
		replacement: "AWS_SECRET_ACCESS_KEY=***REDACTED***",
	},
	{ regex: /glpat-[a-zA-Z0-9-]{20}/g, replacement: "***REDACTED***" },
	{ regex: /ghp_[a-zA-Z0-9]{36}/g, replacement: "***REDACTED***" },
];

export function redact(text: string): string {
	return PATTERNS.reduce(
		(acc, { regex, replacement }) => acc.replace(regex, replacement),
		text,
	);
}
