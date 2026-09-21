import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, HeartHandshake } from "lucide-react";
import {
  getPublicCampConfiguration,
  lookupCampBySlug,
  type PublicCampSession,
} from "@/lib/campLookup";

/**
 * A camp's public page.
 *
 * Three outcomes, and they are kept apart on purpose:
 *   1. a real camps row               -> that camp's own page, with its real
 *      name and links that carry ?camp=<slug> so registrations land in ITS
 *      tenant.
 *   2. one of the remaining SAMPLE slugs -> the labelled example page.
 *   3. neither                         -> an honest "no camp here" page.
 *
 * Before this change every unknown slug silently fell through to Camp Hope
 * (`TENANTS[slug] || TENANTS.camphope`), so a director who typed their link
 * wrong saw someone else's camp branding and a working registration button.
 */

interface TenantData {
  name: string;
  location: string;
  director: string;
  tagline: string;
  heroImage: string;
  sessions: { name: string; grades: string; dates: string; price: string; spots: number }[];
}

/** Sample camps. Not customers. Not rows in the database. */
const SAMPLE_TENANTS: Record<string, TenantData> = {
  camphope: {
    name: "Camp Hope",
    location: "Lancaster, PA",
    director: "Pastor Dave Miller",
    tagline: "Where lifelong friendships and faith take root on the lakefront.",
    heroImage: "/images/camp_hero.jpg",
    sessions: [
      { name: "Junior Camp", grades: "Grades 2–4", dates: "July 11–17, 2027", price: "$650 ($100 deposit)", spots: 8 },
      { name: "Intermediate Camp", grades: "Grades 5–6", dates: "July 18–24, 2027", price: "$650 ($100 deposit)", spots: 14 },
      { name: "Senior Teen Camp", grades: "Grades 7–8", dates: "July 25–31, 2027", price: "$675 ($100 deposit)", spots: 6 }
    ]
  },
  pinetrail: {
    name: "Pine Trail Youth Camp",
    location: "Adirondacks, NY",
    director: "Sarah Jenkins",
    tagline: "High-adventure wilderness trekking, ropes course, and mountain worship.",
    heroImage: "/images/camp_cabin.jpg",
    sessions: [
      { name: "Wilderness Explorers", grades: "Grades 4–6", dates: "July 12–18, 2027", price: "$700 ($100 deposit)", spots: 12 },
      { name: "Mountain Summit Teen", grades: "Grades 7–9", dates: "July 19–25, 2027", price: "$750 ($100 deposit)", spots: 9 }
    ]
  },
  evergreen: {
    name: "Evergreen Retreat Center",
    location: "Cascade Mountains, WA",
    director: "Mark Henderson",
    tagline: "Peaceful forest cabin fellowship, archery, and lake kayaking.",
    heroImage: "/images/camp_campfire.jpg",
    sessions: [
      { name: "Forest Pioneer Camp", grades: "Grades 3–5", dates: "July 5–11, 2027", price: "$625 ($100 deposit)", spots: 15 },
      { name: "Cascade Leadership Camp", grades: "Grades 6–8", dates: "July 12–18, 2027", price: "$675 ($100 deposit)", spots: 10 }
    ]
  }
};

export default async function CampSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  // A real tenant always wins. Camp Hope used to be permanently shadowed by
  // the sample with the same slug, making its actual portal unreachable.
  const lookup = await lookupCampBySlug(slug);
  if (lookup.status === "found") {
    let sessions: PublicCampSession[] = [];
    try {
      sessions = (await getPublicCampConfiguration(lookup.camp.id)).sessions;
    } catch {
      // The identity is still real. Configuration failures must not fall back
      // to made-up sample sessions or another camp.
    }
    return (
      <RealCampPortal
        slug={lookup.camp.slug}
        name={lookup.camp.name}
        directorName={lookup.camp.directorName}
        sessions={sessions}
      />
    );
  }

  const sample = SAMPLE_TENANTS[slug];
  if (sample) return <SampleCampPortal slug={slug} tenant={sample} />;

  // 3. Anything else — including "the database is not migrated yet" — is stated
  //    plainly rather than being papered over with another camp's branding.
  return <NoCampHere slug={slug} setupIncomplete={lookup.status === "setup_incomplete"} />;
}

// ---------------------------------------------------------------- real camp --

function RealCampPortal({
  slug,
  name,
  directorName,
  sessions,
}: {
  slug: string;
  name: string;
  directorName: string | null;
  sessions: PublicCampSession[];
}) {
  return (
    <main className="space-y-10 sm:space-y-14 pb-20">
      <section className="px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative min-h-[380px] flex flex-col justify-between p-6 sm:p-12 border-2 border-stone-800 shadow-2xl bg-stone-950">
          <Image
            src="/images/camp_hero.jpg"
            alt=""
            aria-hidden
            fill
            priority
            className="object-cover opacity-30 filter brightness-90"
          />
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-stone-300 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
              camperroster.com/c/{slug}
            </span>
          </div>

          <div className="relative z-10 max-w-2xl space-y-4 pt-12">
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight drop-shadow-md">
              {name}
            </h1>
            {directorName && (
              <p className="text-sm sm:text-base text-stone-300 font-medium">Camp director: {directorName}</p>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/register?camp=${encodeURIComponent(slug)}`}
                className="px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-transform"
              >
                <span>Register a camper</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
              <Link
                href={`/volunteer?camp=${encodeURIComponent(slug)}`}
                className="px-6 py-4 rounded-xl bg-stone-900/90 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm border border-stone-700 flex items-center justify-center gap-2 backdrop-blur-xs"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Apply to volunteer</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 max-w-4xl mx-auto">
        {sessions.length ? (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-black text-2xl text-stone-900">Available sessions</h2>
              <p className="text-sm text-stone-600 mt-1">Dates and tuition come directly from {name}&apos;s current setup.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <article key={session.id} className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-stone-900">{session.name}</h3>
                    <p className="text-sm text-stone-600">{formatDateRange(session.startDate, session.endDate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-stone-700">
                    <span className="bg-stone-100 rounded-full px-3 py-1">Grades {session.minGrade}&ndash;{session.maxGrade}</span>
                    <span className="bg-emerald-100 text-emerald-900 rounded-full px-3 py-1">{formatMoney(session.priceCents)}</span>
                    {session.depositCents > 0 && (
                      <span className="bg-amber-100 text-amber-900 rounded-full px-3 py-1">{formatMoney(session.depositCents)} deposit</span>
                    )}
                  </div>
                  <Link
                    href={`/register?camp=${encodeURIComponent(slug)}&session=${encodeURIComponent(session.id)}`}
                    className="inline-flex items-center gap-2 text-sm font-black text-forest-900 underline underline-offset-4"
                  >
                    Register for this session <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-sm space-y-2">
            <b className="font-display font-extrabold text-base text-stone-900 block">Registration is not open yet</b>
            <p className="text-sm text-stone-600 leading-relaxed">
              {name} has not published an active session through CamperRoster. No dates, prices, or availability are being guessed.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${start}T00:00:00Z`))} – ${formatter.format(new Date(`${end}T00:00:00Z`))}`;
}

// -------------------------------------------------------------- no such camp --

function NoCampHere({ slug, setupIncomplete }: { slug: string; setupIncomplete: boolean }) {
  return (
    <main className="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-2xl text-stone-900">
          {setupIncomplete ? "Camp lookup is unavailable" : `No camp at "${slug}"`}
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          {setupIncomplete
            ? "This deployment's database has not been migrated yet, so camp pages cannot be resolved. Nothing is wrong with your link."
            : `No camp is registered at camperroster.com/c/${slug}. Check the link your camp gave you — it is case-insensitive but the spelling has to match.`}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs">
            Return home
          </Link>
          <Link href="/start" className="px-5 py-2.5 rounded-xl bg-forest-900 text-white font-bold text-xs">
            Run a camp? Create yours
          </Link>
        </div>
      </div>
    </main>
  );
}

// ------------------------------------------------------------- sample camps --

function SampleCampPortal({ slug, tenant }: { slug: string; tenant: TenantData }) {
  return (
    <main className="space-y-12 sm:space-y-20 pb-20">

      {/* DEMO RIBBON - these tenants are samples, not customers */}
      <div className="bg-amber-100 border-b-2 border-amber-300 px-4 py-3 text-center">
        <p className="text-xs font-bold text-amber-950 max-w-3xl mx-auto leading-relaxed">
          Example camp portal. {tenant.name} is one of our sample camps, not a CamperRoster customer &mdash;
          this page shows what your own camp&apos;s branded registration page would look like. Sessions,
          prices and openings below are made up, and nothing here takes a payment.
        </p>
      </div>

      {/* TENANT BRANDED HERO */}
      <section className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative min-h-[500px] flex flex-col justify-between p-6 sm:p-12 border-2 border-stone-800 shadow-2xl bg-stone-950">
          <Image
            src={tenant.heroImage}
            alt={tenant.name}
            fill
            priority
            className="object-cover opacity-35 filter brightness-90"
          />

          {/* TOP PILLS */}
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md">
              SAMPLE CAMP PORTAL
            </span>
            <span className="bg-emerald-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>EXAMPLE SESSIONS</span>
            </span>
            <span className="text-xs font-mono font-bold text-stone-300 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
              Powered by CamperRoster OS
            </span>
          </div>

          {/* TITLE & CALL TO ACTION */}
          <div className="relative z-10 max-w-2xl space-y-4 pt-12">
            <span className="text-amber-300 font-mono text-xs font-bold tracking-widest uppercase block">
              {tenant.location} • Example camp
            </span>
            <h1 className="font-display font-black text-3xl sm:text-6xl text-white tracking-tight leading-tight drop-shadow-md">
              {tenant.name}
            </h1>
            <p className="text-base sm:text-xl text-stone-200 font-medium leading-relaxed drop-shadow-sm">
              {tenant.tagline}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              {/* Points at /start, not /register. The registration form now
                  writes into a real camp resolved from ?camp=<slug>, and these
                  sample slugs are not rows in the database — so a "try it"
                  button aimed at /register would land on "no camp at
                  camphope". */}
              <Link
                href="/start"
                className="px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-98 transition-transform"
              >
                <span>Create your camp to use this flow</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
              <Link
                href={`/portal?camp=${slug}`}
                className="px-6 py-4 rounded-xl bg-stone-900/90 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm border border-stone-700 flex items-center justify-center gap-2 backdrop-blur-xs"
              >
                <span>Parent Household Portal →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SESSIONS GRID */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 bg-forest-100 px-3 py-1 rounded-full">
EXAMPLE SESSIONS
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Choose Your Week at {tenant.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenant.sessions.map((s, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-md space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="bg-amber-100 text-amber-950 px-2.5 py-1 rounded-md">{s.grades}</span>
                  <span className="text-stone-500 font-mono">Sample: {s.spots} spots</span>
                </div>
                <h3 className="font-display font-black text-xl text-stone-950">{s.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
                  <Calendar className="w-4 h-4 text-forest-800" />
                  <span>{s.dates}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <b className="font-display font-black text-2xl text-stone-950 block">{s.price}</b>
                <Link
                  href="/start"
                  className="w-full py-3.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-xs text-center block"
                >
                  Create your camp to take bookings →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
