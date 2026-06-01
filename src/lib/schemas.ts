import { Type } from "typebox";

export const OptionalProject = Type.Optional(
	Type.String({
		description:
			"Project path (e.g. 'agents/primecodex/packages/pi-gitlab') or numeric ID. Optional — falls back to CWD git remote, then settings default.",
	}),
);

export const MaxRows = Type.Optional(
	Type.Number({
		default: 25,
		maximum: 200,
		description: "Maximum rows to return.",
	}),
);
