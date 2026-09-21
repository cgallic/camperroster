export function parseNameSearch(raw: string): { value: string; invalid: boolean } {
  const normalized = raw
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const value = Array.from(normalized).slice(0, 80).join("");
  return {
    value,
    invalid: raw.trim().length > 0 && !/[\p{L}\p{N}]/u.test(value),
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
}

function ilikePattern(value: string): string {
  const escaped = value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `"%${escaped}%"`;
}

export function buildNameSearchFilter(search: string): string {
  const parts = search.split(/\s+/).filter(Boolean);
  const filters = [
    `first_name.ilike.${ilikePattern(search)}`,
    `last_name.ilike.${ilikePattern(search)}`,
  ];

  for (let split = 1; split < parts.length; split += 1) {
    const left = parts.slice(0, split).join(" ");
    const right = parts.slice(split).join(" ");
    filters.push(
      `and(first_name.ilike.${ilikePattern(left)},last_name.ilike.${ilikePattern(right)})`,
      `and(first_name.ilike.${ilikePattern(right)},last_name.ilike.${ilikePattern(left)})`,
    );
  }

  return filters.join(",");
}
