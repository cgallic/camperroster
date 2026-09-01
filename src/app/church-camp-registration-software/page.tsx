import Link from "next/link";
import { CheckCircle2, PhoneCall, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Church Camp Registration Software — Faith-Based Camp Management",
  description: "Purpose-built registration software for church retreats and Christian youth camps. Includes volunteer pastoral reference calls, health waivers, and sibling discounts.",
};

export default function ChurchCampPage() {
  return (
    <main className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 font-mono text-xs font-bold uppercase tracking-wider">
            ⛪ Faith-Based & Church Camps
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-stone-900 tracking-tight">
            Faithful stewardship. <span className="text-forest-800">Effortless camp registration.</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Built specifically for church youth pastors, faith-based summer camps, and volunteer-led ministries. Protect your young people with automated pastoral reference calls and digital health waivers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="double-bezel p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">Automated Pastoral Reference Calls</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              KaiCalls voice assistant automatically calls youth pastors and mentors to conduct a 2-minute safety reference interview, transcribing and scoring responses directly for the director.
            </p>
          </div>

          <div className="double-bezel p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">Sibling & Volunteer Discounts</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Automatic multi-child sibling discounts and staff registration waivers without confusing coupon codes or manual bookkeeping.
            </p>
          </div>

          <div className="double-bezel p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">Digital Health & Waterfront Waivers</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Legally vetted medical treatment authorizations, photo releases, and lake canoeing waivers signed electronically by guardians.
            </p>
          </div>

          <div className="double-bezel p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sun-100 text-sun-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">Cabin Buddy Guarantee</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ensure church youth groups and best friends are placed in the same cabin with automated mutual buddy matching.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/volunteer"
            className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>Preview Church Volunteer Application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
