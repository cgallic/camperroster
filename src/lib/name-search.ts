export function buildNameSearchFilter(search: string): string {
  const parts = search.split(/\s+/).filter(Boolean);
  const filters = [
    `first_name.ilike.%${search}%`,
    `last_name.ilike.%${search}%`,
  ];

  for (let split = 1; split < parts.length; split += 1) {
    const left = parts.slice(0, split).join(" ");
    const right = parts.slice(split).join(" ");
    filters.push(
      `and(first_name.ilike.%${left}%,last_name.ilike.%${right}%)`,
      `and(first_name.ilike.%${right}%,last_name.ilike.%${left}%)`,
    );
  }

  return filters.join(",");
}
