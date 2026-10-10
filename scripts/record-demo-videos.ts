/**
 * Records short product demo videos of the real staff screens (the same
 * /demo-preview harness scripts/capture-screenshots.ts uses), with a visible
 * cursor and a caption bar per scene. Writes MP4 + poster PNG per video.
 *
 *   npm run build
 *   SCREENSHOT_MODE=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npx next start -p 3200 &
 *   node --experimental-strip-types scripts/record-demo-videos.ts http://127.0.0.1:3200 <out-dir> [only-video-name]
 *
 * Every /api call is answered here from src/lib/demo/fixtures.ts; writes
 * (record a dose, charge a wallet, check in, walkthrough form) get a fake
 * success so nothing touches a database or sends anything.
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { demoBunkNotes, demoCampers, demoMedications } from "../src/lib/demo/fixtures.ts";

const base = process.argv[2] ?? "http://127.0.0.1:3200";
const outDir = process.argv[3] ?? "videos";
const only = process.argv[4];
const tmp = mkdtempSync(join(process.env.VIDEO_TMP || tmpdir(), "cr-video-"));
const FFMPEG = "/usr/bin/ffmpeg";
const W = 1280, H = 800;

const day = new Date().toISOString().slice(0, 10);
const camp = { campId: "demo", campName: "Camp Willow Creek (Demo)", slug: "demo" };

// ---------- fake API ----------
function makeApi() {
  const balances = new Map(demoCampers.map((c) => [c.registrationId, c.balance]));
  // Arrivals confirmed at the gate show up on the counselor roster too.
  const arrived = new Set(demoCampers.filter((c) => c.checkedIn).map((c) => c.registrationId));
  const get: Record<string, () => unknown> = {
    "/api/nurse/emar": () => ({ success: true, camp, medications: demoMedications(day) }),
    "/api/canteen/roster": () => ({ success: true, camp, registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.legalName, balanceCents: balances.get(c.registrationId) })) }),
    "/api/counselor/roster": () => ({
      success: true, camp,
      registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.displayName, legalName: c.legalName, birthDate: c.birth, grade: c.grade, buddyRequests: c.buddies ?? [], checkedIn: arrived.has(c.registrationId), cabinId: c.cabinId, cabin: c.cabin, counselor: c.counselor })),
    }),
    "/api/admin/checkin": () => ({
      success: true, camp,
      registrations: demoCampers.map((c) => ({ id: c.registrationId, name: c.displayName, legalName: c.legalName, grade: c.grade, status: "confirmed", cabin: c.cabin, counselor: c.counselor, canteenBalanceCents: balances.get(c.registrationId), checkedIn: arrived.has(c.registrationId), checkedInAt: arrived.has(c.registrationId) ? `${day}T14:30:00Z` : null })),
    }),
    "/api/portal/bunk-notes": () => ({ success: true, notes: demoBunkNotes(day) }),
    "/api/auth/me": () => ({ authenticated: false }), // marketing nav shows "Log in"
  };
  const post: Record<string, (body: any) => unknown> = {
    "/api/nurse/emar": () => ({ success: true, medication: { administered_at: new Date().toISOString(), administered_by: "nurse.kelly@example.com", notes: null } }),
    "/api/portal/canteen": (b) => {
      const next = (balances.get(b.registration_id) ?? 0) + Number(b.amount_cents);
      balances.set(b.registration_id, next);
      return { success: true, new_balance_cents: next };
    },
    "/api/admin/checkin": (b) => {
      arrived.add(b.registration_id);
      return { success: true, registration: { checked_in_at: new Date().toISOString() } };
    },
    "/api/leads": () => ({ success: true }),
  };
  return async (route: any) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (req.method() === "GET" && get[path]) return route.fulfill({ json: get[path]() });
    if (req.method() === "POST" && post[path]) {
      await new Promise((r) => setTimeout(r, 450)); // let the spinner show briefly
      return route.fulfill({ json: post[path](req.postDataJSON()) });
    }
    console.warn(`  unhandled ${req.method()} ${path}`);
    return route.fulfill({ status: 403, json: { success: false, error: "demo_read_only" } });
  };
}

// ---------- in-page overlay: cursor + caption, survive navigation via sessionStorage ----------
const overlayInit = () => {
  const mount = () => {
    if (document.getElementById("__demo_cursor")) return;
    const cur = document.createElement("div");
    cur.id = "__demo_cursor";
    cur.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(cur.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", transition: "transform 40ms linear" });
    const pos = JSON.parse(sessionStorage.getItem("__cur") || '{"x":640,"y":400}');
    cur.style.transform = `translate(${pos.x - 3}px, ${pos.y - 2}px)`;
    document.documentElement.appendChild(cur);
    const ring = document.createElement("div");
    ring.id = "__demo_ring";
    Object.assign(ring.style, { position: "fixed", width: "34px", height: "34px", borderRadius: "50%", border: "3px solid rgba(16,185,129,.9)", zIndex: "2147483646", pointerEvents: "none", opacity: "0", transition: "opacity 300ms, transform 300ms" });
    document.documentElement.appendChild(ring);

    const bar = document.createElement("div");
    bar.id = "__demo_caption";
    Object.assign(bar.style, {
      position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "2147483645", pointerEvents: "none",
      background: "rgba(12,24,18,.86)", color: "#fff", font: "700 28px/1.25 Inter, system-ui, sans-serif",
      padding: "20px 48px", textAlign: "center", letterSpacing: "-0.01em",
    });
    document.documentElement.appendChild(bar);
    (window as any).__setCap = (t: string) => {
      sessionStorage.setItem("__cap", t);
      bar.textContent = t;
      bar.style.display = t ? "block" : "none";
    };
    (window as any).__setCap(sessionStorage.getItem("__cap") || "");

    document.addEventListener("mousemove", (e) => {
      cur.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`;
      sessionStorage.setItem("__cur", JSON.stringify({ x: e.clientX, y: e.clientY }));
    }, true);
    document.addEventListener("mousedown", (e) => {
      ring.style.left = `${e.clientX - 17}px`; ring.style.top = `${e.clientY - 17}px`;
      ring.style.transition = "none"; ring.style.opacity = "1"; ring.style.transform = "scale(.6)";
      requestAnimationFrame(() => { ring.style.transition = "opacity 450ms, transform 450ms"; ring.style.opacity = "0"; ring.style.transform = "scale(1.4)"; });
    }, true);

    // Staff nav links point at the real (auth-gated) routes; send them to the preview harness instead.
    const map: Record<string, string> = {
      "/admin": "/demo-preview/admin", "/admin/cabins": "/demo-preview/cabins", "/nurse/emar": "/demo-preview/emar",
      "/canteen/pos": "/demo-preview/pos", "/counselor": "/demo-preview/counselor", "/admin/checkin": "/demo-preview/checkin",
      "/admin/bunk-notes": "/demo-preview/bunk-notes",
    };
    document.addEventListener("click", (e) => {
      const a = (e.target as HTMLElement).closest?.("a");
      if (!a) return;
      const path = new URL(a.href, location.href).pathname;
      if (map[path]) { e.preventDefault(); e.stopImmediatePropagation(); location.href = map[path]; }
    }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
};

// ---------- helpers ----------
let current: any = null; // the page being recorded
const pause = (ms = 1000) => current.waitForTimeout(ms);

async function caption(page: any, text: string) {
  await page.evaluate((t: string) => (window as any).__setCap?.(t), text);
}
async function preCaption(page: any, text: string) {
  await page.evaluate((t: string) => { try { sessionStorage.setItem("__cap", t); } catch {} }, text);
}

async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForFunction(() => !/Loading/.test(document.body.innerText), null, { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

/** Smooth-scroll so the element sits near `frac` of the visible area, then glide the cursor to it. */
async function reveal(page: any, loc: any, frac = 0.4) {
  await loc.waitFor({ state: "visible" });
  const scrolled = await page.evaluate(([el, f]: [HTMLElement, number]) => {
    const r = el.getBoundingClientRect();
    // Already comfortably on screen (clear of the nav and the caption bar)? Leave the page still.
    if (el.closest("header") || (r.top > 110 && r.bottom < window.innerHeight - 110)) return false;
    const target = window.scrollY + r.top - (window.innerHeight - 90) * f;
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    return true;
  }, [await loc.elementHandle(), frac]);
  if (scrolled) await pause(800);
}
async function hover(page: any, loc: any, opts: { frac?: number; steps?: number; dx?: number } = {}) {
  await reveal(page, loc, opts.frac);
  const box = await loc.boundingBox();
  const x = box.x + (opts.dx ?? box.width / 2), y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: opts.steps ?? 22 });
  await pause(250);
  return { x, y };
}
async function click(page: any, loc: any, opts: { frac?: number; dx?: number } = {}) {
  const { x, y } = await hover(page, loc, opts);
  await page.mouse.down();
  await pause(90);
  await page.mouse.up();
}
async function type(page: any, loc: any, text: string, delay = 75) {
  await click(page, loc);
  await loc.pressSequentially(text, { delay });
}
async function scrollBy(page: any, dy: number, ms = 1400) {
  await page.evaluate((d: number) => window.scrollBy({ top: d, behavior: "smooth" }), dy);
  await pause(ms);
}
async function go(page: any, path: string, cap: string) {
  await preCaption(page, cap);
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await settle(page);
  await caption(page, cap);
}
/** Click a staff nav item (optionally inside a dropdown) and land on the matching preview screen. */
async function navTo(page: any, label: string, cap: string, group?: string) {
  await preCaption(page, cap);
  const nav = page.locator("header nav").filter({ visible: true }).first();
  if (group) {
    await click(page, nav.getByRole("button", { name: group }).filter({ visible: true }).first());
    await pause(700);
  }
  const link = page.locator("header").getByRole("link", { name: label, exact: true }).filter({ visible: true }).first();
  await Promise.all([page.waitForURL(/demo-preview/), click(page, link)]);
  await settle(page);
}

// ---------- scenes ----------
// Each scene*() returns the actions to play once its screen is on display.
// `long` is the single-feature clip version; the overview uses the short one.
const vis = (loc: any) => loc.filter({ visible: true }).first();

async function sceneAdmin(page: any) {
  await go(page, "/demo-preview/admin", "Director dashboard: registrations, volunteers and open reviews at a glance");
  return async () => {
    await pause(1000);
    await hover(page, vis(page.getByText("Campers registered")), { frac: 0.2 });
    await pause(800);
    await hover(page, vis(page.getByText("Medical holds")), { frac: 0.2 });
    await caption(page, "Allergy records and reference calls waiting on a director, in one queue");
    await pause(800);
    await hover(page, vis(page.getByText("Peanuts and tree nuts (anaphylactic)")));
    await pause(900);
    await hover(page, vis(page.getByText("Pastor Mike Allen call")));
    await pause(1000);
  };
}

async function sceneCabins(page: any, long = false) {
  return async () => {
    await pause(1000);
    await hover(page, vis(page.getByText("Campers placed")), { frac: 0.2 });
    await pause(800);
    await caption(page, "Cabins grouped by gender and grade band, with beds filled against each cap");
    await hover(page, vis(page.getByText("Ava Lopez")), { frac: 0.3 });
    await pause(800);
    await hover(page, vis(page.getByText("4 spots remaining")));
    await pause(1000);
    if (long) {
      await caption(page, "Every camper's cabin assignment, cabin by cabin");
      await hover(page, vis(page.getByText("Sophia Martinez")), { frac: 0.4 });
      await pause(900);
      await hover(page, vis(page.getByText("Oliver Hayes")), { frac: 0.4 });
      await pause(800);
      await hover(page, vis(page.getByText("Mateo Rivera")), { steps: 10 });
      await pause(900);
      await caption(page, "Raise or lower a cabin's cap from the board");
      await hover(page, page.getByRole("button", { name: "+" }).nth(2));
      await pause(1200);
      // Stay above the (empty, in the demo) waitlist panel at the bottom of the board.
      await hover(page, vis(page.getByText("Ethan Brown")), { frac: 0.72 });
      await pause(1200);
    }
  };
}

async function sceneEmar(page: any, long = false) {
  return async () => {
    await pause(1000);
    await hover(page, vis(page.getByText("Methylphenidate")), { frac: 0.3 });
    await caption(page, "Each dose given is recorded with the time and the nurse who gave it");
    await pause(800);
    await hover(page, vis(page.getByText(/Recorded .* by nurse/)));
    await pause(1000);
    await caption(page, "Filter the medication pass by breakfast, lunch, dinner or bedtime");
    await click(page, page.getByRole("button", { name: "lunch", exact: true }), { frac: 0.1 });
    await pause(1000);
    await caption(page, "Record a dose in one tap");
    const card = vis(page.locator("article").filter({ hasText: "Albuterol inhaler" }));
    await hover(page, card.getByText("Albuterol inhaler"), { frac: 0.3 });
    await pause(600);
    await click(page, card.getByRole("button", { name: /Record administered dose/ }));
    await vis(page.getByText(/Recorded .* by nurse/)).waitFor();
    await hover(page, vis(page.getByText(/Recorded .* by nurse/)), { steps: 10 });
    await pause(1300);
    if (long) {
      await caption(page, "Bedtime pass: insulin and other evening doses");
      await click(page, page.getByRole("button", { name: "bedtime", exact: true }), { frac: 0.1 });
      await pause(1200);
      await hover(page, vis(page.getByText("Insulin glargine")), { frac: 0.3 });
      await pause(1200);
      await caption(page, "The whole day's medication pass on one screen");
      await click(page, page.getByRole("button", { name: "all", exact: true }), { frac: 0.1 });
      await pause(1000);
      await scrollBy(page, 420);
      await pause(800);
    }
  };
}

async function scenePos(page: any, long = false) {
  return async () => {
    await pause(1000);
    if (long) {
      await hover(page, vis(page.getByText("Lucas Wright")), { frac: 0.4 });
      await pause(800);
    }
    await type(page, page.locator("#wallet-search"), "Oliver");
    await caption(page, "Find a camper and ring up a sale");
    await pause(600);
    await click(page, vis(page.getByRole("button", { name: /Oliver Hayes/ })));
    await pause(800);
    await type(page, page.locator("#charge-amount"), "3.50");
    await type(page, page.locator("#charge-note"), "Lemonade and a granola bar", 45);
    await pause(600);
    await click(page, page.getByRole("button", { name: /^Charge \$/ }));
    await caption(page, "The charge posts to the wallet history with a receipt note");
    await page.getByRole("status").waitFor();
    await hover(page, page.getByRole("status"), { steps: 12 });
    await pause(1500);
    if (long) {
      await caption(page, "A wallet can't go below zero");
      await page.locator("#wallet-search").fill("");
      await type(page, page.locator("#wallet-search"), "Henry");
      await pause(500);
      await click(page, vis(page.getByRole("button", { name: /Henry Sullivan/ })));
      await pause(700);
      await type(page, page.locator("#charge-amount"), "15");
      await hover(page, vis(page.getByText("Charge exceeds the available balance.")), { steps: 12 });
      await pause(1500);
    }
  };
}

async function sceneCheckin(page: any) {
  return async () => {
    await pause(900);
    await type(page, page.locator("#camper-search"), "Ben");
    await pause(500);
    await click(page, vis(page.getByRole("button", { name: /^Ben/ })));
    await pause(1000);
    await click(page, page.getByRole("button", { name: /Confirm check-in/ }));
    await vis(page.getByText(/Checked in at/)).waitFor();
    await caption(page, "Arrival saved to the registration record, with cabin and counselor in view");
    await pause(1600);
  };
}

async function sceneCounselor(page: any) {
  return async () => {
    await pause(900);
    await hover(page, vis(page.getByText("Buddy request:")), { frac: 0.55 });
    await pause(700);
    await scrollBy(page, 420, 1000);
    await hover(page, vis(page.getByText("Not checked in")));
    await pause(900);
  };
}

async function sceneBunkNotes(page: any) {
  return async () => {
    await pause(900);
    await hover(page, vis(page.getByText(/Hi buddy!/)));
    await pause(900);
    await hover(page, page.getByRole("button", { name: /Print notes/ }));
    await pause(1000);
  };
}

async function scenePricingAndForm(page: any) {
  await go(page, "/pricing", "Per-camper pricing, $0 a month in the off-season");
  await page.evaluate(() => window.scrollTo({ top: 1150 }));
  await pause(1000);
  await hover(page, vis(page.getByText("All-In-One Camp OS")), { frac: 0.3 });
  await pause(1200);
  const form = vis(page.locator("form").filter({ has: page.locator('input[name="email"]') }));
  await reveal(page, form, 0.15);
  await caption(page, "Book a 20-minute walkthrough with your own camp in mind");
  await type(page, form.locator('input[name="name"]'), "Dana Whitaker", 50);
  await type(page, form.locator('input[name="campName"]'), "Camp Willow Creek", 50);
  await hover(page, form.getByRole("button", { name: /Book a 20-minute walkthrough/ }));
  await pause(1500);
}

// ---------- recording ----------
type Marker = { t: number; label: string };

async function record(browser: any, name: string, script: (page: any, mark: (l: string) => void) => Promise<void>) {
  console.log(`recording ${name}`);
  const dir = join(tmp, name);
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 1, timezoneId: "America/New_York", locale: "en-US",
    recordVideo: { dir, size: { width: W, height: H } },
  });
  await ctx.addInitScript(overlayInit);
  await ctx.route("**/api/**", makeApi());
  const page = await ctx.newPage();
  current = page;
  const t0 = Date.now();
  const markers: Marker[] = [];
  const mark = (label: string) => markers.push({ t: (Date.now() - t0) / 1000, label });
  await script(page, mark);
  await pause(1200);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  return { webm, markers, trim: markers[0]?.t ?? 0 };
}

function encode(name: string, rec: { webm: string; markers: Marker[]; trim: number }, posterAt: number) {
  const mp4 = join(outDir, `${name}.mp4`);
  const tmpMp4 = join(tmp, `${name}.mp4`);
  const start = Math.max(0, rec.trim - 0.15).toFixed(2);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-ss", start, "-i", rec.webm, "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "30",
    "-movflags", "+faststart", tmpMp4]);
  copyFileSync(tmpMp4, mp4);
  const poster = join(outDir, `${name}-poster.png`);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-ss", posterAt.toFixed(2), "-i", mp4, "-frames:v", "1", poster]);
  const dur = Number(execFileSync("/usr/bin/ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString());
  console.log(`  ${mp4} ${dur.toFixed(1)}s ${(statSync(mp4).size / 1e6).toFixed(2)}MB`);
  console.log(`  markers: ${rec.markers.map((m) => `${(m.t - rec.trim).toFixed(1)}s ${m.label}`).join(" | ")}`);
}

/** Run a scene whose page is already loaded: mark when ready, then play it. */
async function play(mark: (l: string) => void, label: string, prepared: Promise<() => Promise<void>>) {
  const run = await prepared;
  mark(label);
  await run();
}

const videos: Record<string, { run: (page: any, mark: (l: string) => void) => Promise<void>; poster: number }> = {
  "camperroster-overview": {
    poster: 0.8,
    run: async (page, mark) => {
      await play(mark, "admin", sceneAdmin(page));
      await navTo(page, "Cabins & waitlist", "Cabin board: every camper's cabin, with beds filled against each cap", "Registration");
      await play(mark, "cabins", sceneCabins(page));
      await navTo(page, "Medication log", "Health lodge eMAR: today's scheduled doses by camper");
      await play(mark, "emar", sceneEmar(page));
      await navTo(page, "Canteen", "Canteen register: every camper's wallet balance");
      await play(mark, "pos", scenePos(page));
      await navTo(page, "Check-in", "Gate check-in: search a camper, confirm arrival");
      await play(mark, "checkin", sceneCheckin(page));
      await navTo(page, "Counselor roster", "Counselor roster: cabin, arrival status and buddy requests, no medical details");
      await play(mark, "counselor", sceneCounselor(page));
      await navTo(page, "Bunk notes", "Bunk notes from families, ready to print and hand out", "Mail");
      await play(mark, "bunk-notes", sceneBunkNotes(page));
      mark("pricing");
      await scenePricingAndForm(page);
    },
  },
  "camperroster-cabins": {
    poster: 3.5,
    run: async (page, mark) => {
      await go(page, "/demo-preview/cabins", "Cabin board: every camper's cabin, with beds filled against each cap");
      await play(mark, "cabins", sceneCabins(page, true));
    },
  },
  "camperroster-emar": {
    poster: 1.5,
    run: async (page, mark) => {
      await go(page, "/demo-preview/emar", "Health lodge eMAR: today's scheduled doses by camper");
      await play(mark, "emar", sceneEmar(page, true));
    },
  },
  "camperroster-pos": {
    poster: 12,
    run: async (page, mark) => {
      await go(page, "/demo-preview/pos", "Canteen register: every camper's wallet balance");
      await play(mark, "pos", scenePos(page, true));
    },
  },
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium" });
try {
  for (const [name, v] of Object.entries(videos)) {
    if (only && only !== name) continue;
    const rec = await record(browser, name, v.run);
    encode(name, rec, v.poster);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
