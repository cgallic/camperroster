import type { Metadata } from "next";
import Link from "next/link";
import WalkthroughForm from "@/components/WalkthroughForm";
import ProductShot, { type ShotName } from "@/components/ProductShot";

const title = "Camp Software Demo: Tour Every Screen | CamperRoster";
const description =
  "See CamperRoster running a sample camp: director dashboard, cabin board, medication log, check-in, canteen register, counselor roster and bunk notes.";
const url = "https://camperroster.com/demo";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "CamperRoster", images: [{ url: "/screenshots/admin.png", width: 2560, height: 1720 }] },
};

const STEPS: { id: ShotName; who: string; heading: string; body: string; more?: { href: string; label: string } }[] = [
  {
    id: "admin", who: "Director", heading: "Start the morning with what needs you",
    body: "Registrations against your cap, volunteers in the pipeline, and one queue of the records nobody else can clear: allergy plans a nurse hasn't signed off and reference notes waiting on a decision.",
    more: { href: "/summer-camp-management-software", label: "Summer camp management software" },
  },
  {
    id: "cabins", who: "Registrar", heading: "Place campers by grade and gender",
    body: "Each cabin shows who is in it and how many beds are left. Move a camper, raise a cap, close a cabin, or offer a waitlist spot in sign-up order.",
    more: { href: "/church-camp-registration-software", label: "Church camp registration software" },
  },
  {
    id: "emar", who: "Nurse", heading: "Give meds by meal time, with a record of every dose",
    body: "Breakfast, lunch, dinner and bedtime tabs. Tap a dose when it's given and it's stamped with the time and the nurse who gave it. Only health staff can open this screen.",
    more: { href: "/camp-health-records-software", label: "Camp health records software" },
  },
  {
    id: "checkin", who: "Gate staff", heading: "Check campers in on opening day",
    body: "Every registration with its cabin, counselor and canteen balance. Mark arrivals as families pull up and see who is still on the road.",
    more: { href: "/camp-registration-software-vs-google-forms", label: "CamperRoster vs Google Forms" },
  },
  {
    id: "pos", who: "Canteen", heading: "Run the camp store without cash",
    body: "Pick a camper, enter the sale and what was bought, and charge their wallet. Balances can't go negative and every charge lands in an audit trail.",
    more: { href: "/cashless-camp-canteen-pos", label: "Camp POS and cashless canteen" },
  },
  {
    id: "counselor", who: "Counselor", heading: "Know your cabin, and nothing you shouldn't",
    body: "Counselors see their campers, ages, buddy requests and who has arrived. Parent contacts and medical details stay with the director and nurse.",
  },
  {
    id: "bunk-notes", who: "Office", heading: "Print parents' letters for mail call",
    body: "Staff enter bunk notes for campers. The office sees the day's notes by camper and prints them in one batch.",
    more: { href: "/christian-camp-software", label: "Christian camp software" },
  },
];

export default function DemoTour() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-16 sm:space-y-24">
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">PRODUCT TOUR</span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-950 tracking-tight leading-[1.1]">
          See CamperRoster running a camp.
        </h1>
        <p className="text-base sm:text-lg text-stone-600 font-medium leading-relaxed">
          These are the real staff screens, filled with Camp Willow Creek, a sample camp with sixteen made-up campers. Nothing here is a mockup.
        </p>
        <nav className="flex flex-wrap justify-center gap-2 pt-2 text-xs font-bold" aria-label="Jump to a screen">
          {STEPS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-stone-700 hover:border-forest-800">{s.who}</a>
          ))}
        </nav>
      </section>

      {STEPS.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 space-y-6">
          <div className="max-w-3xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest-800">{`${i + 1}. ${s.who}`}</span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">{s.heading}</h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">{s.body}</p>
            {s.more && (
              <Link href={s.more.href} className="inline-block pt-1 text-sm font-bold text-forest-900 underline underline-offset-4 hover:text-forest-700">{s.more.label} →</Link>
            )}
          </div>
          <ProductShot name={s.id} alt={`${s.heading}: CamperRoster ${s.who.toLowerCase()} screen`} priority={i === 0} />
        </section>
      ))}

      <section className="bg-forest-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-5 shadow-2xl border-2 border-emerald-400">
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">Set this up for your camp.</h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          $0 setup and $0 a month in the off-season. Bring your roster as a spreadsheet and it is mapped in before anything is saved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link href="/start" className="px-10 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-xl">Create your camp ($0 setup) →</Link>
          <Link href="/pricing" className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm">See pricing</Link>
        </div>
      </section>

      <section id="walkthrough" className="scroll-mt-24">
        <div className="max-w-3xl mx-auto bg-forest-950 rounded-3xl p-6 sm:p-12 space-y-5 text-center border-2 border-emerald-400 shadow-2xl">
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white">Want to see it with your own camp in mind?</h2>
          <p className="text-sm text-stone-300 max-w-xl mx-auto">
            Tell us a little about your camp and we will walk you through registration, forms, health records and cabins in 20 minutes.
          </p>
          <WalkthroughForm source="demo" tone="dark" />
        </div>
      </section>
    </main>
  );
}
