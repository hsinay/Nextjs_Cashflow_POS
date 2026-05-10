/**
 * Converts a dot-notation sort field + direction into a Prisma-compatible orderBy object.
 * e.g. ("supplier.name", "asc") → { supplier: { name: "asc" } }
 * Falls back to `defaultOrderBy` when sortField/sortDir are absent or invalid.
 */
export function buildOrderBy(
  sortField: string | undefined,
  sortDir: 'asc' | 'desc' | undefined,
  defaultOrderBy: Record<string, unknown>
): Record<string, unknown> {
  if (!sortField || !sortDir) return defaultOrderBy;

  const parts = sortField.split('.');
  if (parts.length === 1) return { [parts[0]]: sortDir };
  if (parts.length === 2) return { [parts[0]]: { [parts[1]]: sortDir } };

  return defaultOrderBy;
}
