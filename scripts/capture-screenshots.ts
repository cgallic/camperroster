/**
 * Photographs the real staff screens, filled with the demo camp, for the
 * marketing pages. Writes public/screenshots/<screen>.png.
 *
 *   npm run build
 *   SCREENSHOT_MODE=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npx next start -p 3200 &
 *   node --experimental-strip-types scripts/capture-screenshots.ts http://127.0.0.1:3200
 *
 * The screens' own /api calls are answered here from src/lib/demo/fixtures.ts,
 * so no database is involved. Set PLAYWRIGHT_CHROMIUM to a chromium binary if
 * Playwright cannot find one.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { demoBunkNotes, demoCampers, demoMedications } from "../src/lib/demo/fixtures.ts";

const base = process.argv[2] ?? "http://127.0.0.1:3200";
const day = new Date().toISOString().slice(0, 10);
const camp = { campId: "demo", campName: "Camp Willow Creek (Demo)", slug: "demo" };

const api: Record<string, unknown> = {
  "/api/nurse/emar": { success: true, camp, medications: demoMedications(day) },
  "/api/canteen/roster": { success: true, camp, registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.legalName, balanceCents: c.balance })) },
  "/api/counselor/roster": {
    success: true, camp,
    registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.displayName, legalName: c.legalName, birthDate: c.birth, grade: c.grade, buddyRequests: c.buddies ?? [], checkedIn: c.checkedIn, cabinId: c.cabinId, cabin: c.cabin, counselor: c.counselor })),
  },
  "/api/admin/checkin": {
    success: true, camp,
    registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.displayName, legalName: c.legalName, grade: c.grade, status: "confirmed", cabin: c.cabin, counselor: c.counselor, canteenBalanceCents: c.balance, checkedIn: c.checkedIn, checkedInAt: c.checkedIn ? `${day}T14:30:00Z` : null })),
  },
  "/api/portal/bunk-notes": { success: true, notes: demoBunkNotes(day) },
};

const screens = ["admin", "cabins", "emar", "pos", "counselor", "checkin", "bunk-notes"];

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
mkdirSync("public/screenshots", { recursive: true });

for (const [label, viewport] of [["", { width: 1280, height: 860 }], ["-mobile", { width: 390, height: 844 }]] as const) {
  // The fixtures schedule doses in camp-local time; render them that way.
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, timezoneId: "America/New_York" });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = api[path];
    return body ? route.fulfill({ json: body }) : route.fulfill({ status: 403, json: { success: false, error: "demo_read_only" } });
  });
  for (const screen of screens) {
    await page.goto(`${base}/demo-preview/${screen}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => !document.body.innerText.includes("Loading"), null, { timeout: 10000 }).catch(() => {});
    // Open a wallet so the register shows a sale in progress, not an empty panel.
    if (screen === "pos") await page.getByText("Oliver Hayes").first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: `public/screenshots/${screen}${label}.png` });
    console.log(`captured ${screen}${label}`);
  }
  await page.close();
}

await browser.close();
