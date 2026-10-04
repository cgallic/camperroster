/**
 * Prints the SQL that creates or refreshes the demo camp. Re-runnable: every
 * row has a fixed id and upserts. Touches only rows with the demo ids.
 *
 *   node --experimental-strip-types scripts/demo-seed-sql.ts > /tmp/demo.sql
 *   psql "$DATABASE_URL" -f /tmp/demo.sql
 *
 * In production the same rows are re-applied nightly by /api/demo/reset.
 * The demo login (DEMO_EMAIL in src/lib/demo/constants.ts)
 * is a director of the demo camp and nothing else.
 */
import { demoRows } from "../src/lib/demo/rows.ts";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `array[${v.map(q).join(",")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

function upsert(table: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `(${cols.map((c) => q(r[c])).join(", ")})`).join(",\n  ");
  const updates = cols.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
  return `insert into public.${table} (${cols.join(", ")}) values\n  ${values}\non conflict (id) do update set ${updates};\n`;
}

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);

const sql = ["begin;", ...demoRows(day).map(([table, rows]) => upsert(table, rows)), "commit;"].join("\n");

process.stdout.write(sql);
