export function limitRows<T>(rows: T[], maxRows: number): T[] {
	return rows.slice(0, maxRows);
}
