"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { PhoneCall, CheckCircle2, ArrowRight, Loader2, ArrowLeft, HeartHandshake, ShieldCheck, AlertTriangle } from "lucide-react";
import type { VolunteerPayload, VolunteerResponse } from "@/lib/formContracts";
import { CampScopeBlocker, useCampScope } from "@/components/CampScope";

/** Camp comes from ?camp=<slug>; see the note in src/components/CampScope.tsx. */
function VolunteerPageInner() {
  const campScope = useCampScope();
  const [role, setRole] = useState("Cabin Counselor");
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refRelationship, setRefRelationship] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (campScope.status !== "found") {
        setError("This application is not attached to a camp. Nothing was saved.");
        return;
      }

      const payload: VolunteerPayload = {
        campSlug: campScope.slug,
        name,
        email,
        phone,
        birthDate,
        role,
        refName,
        refPhone,
        refEmail,
        refRelationship,
      };

      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: VolunteerResponse = await res.json().catch(() => ({ success: false }));

      // Only a real row id counts as success. No id, no success screen.
      if (res.ok && data.success && data.applicationId) {
        setAppId(data.applicationId);
        setSubmitted(true);
      } else {
        setError(data.error || "We could not save your application. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error — your application was not saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (campScope.status !== "found") {
    return <CampScopeBlocker scope={campScope} what="volunteer application" />;
  }

  return (
    <main className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CamperRoster</span>
          </Link>
          <span className="eyebrow-pill bg-sun-100 text-sun-900 border border-sun-200">
            STAFF & VOLUNTEER APPLICATION
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 mt-2">
            Serve at Camp Hope Summer 2027
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Join our dedicated team of counselors, nurses, and kitchen staff to mentor youth in a safe camp environment.
          </p>
        </div>

        <div className="double-bezel-outer p-2">
          <div className="double-bezel-inner p-8 sm:p-12 space-y-8">
            
            {submitted ? (
              <div className="bg-forest-50 p-8 rounded-3xl border border-forest-100 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-display font-black text-2xl text-forest-950">Application Received</h2>
                <p className="text-xs text-stone-700 max-w-md mx-auto leading-relaxed">
                  Thank you, <b>{name}</b>! Your application is saved, and we have recorded <b>{refName}</b> ({refPhone}) as your reference. A camp director reviews references by hand before anyone is contacted. We will follow up at <b>{email}</b>.
                </p>
                <div className="font-mono text-xs text-forest-800 bg-white p-3 rounded-xl border border-forest-200 max-w-sm mx-auto">
                  Application ID: {appId}
                </div>
                <Link href="/" className="btn-primary-agency text-xs justify-center py-3 mt-4">
                  Return to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Info */}
                <div className="space-y-4">
                  <b className="text-sm font-display font-extrabold text-stone-900 block">1. Applicant Details</b>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        placeholder="alex@gmail.com"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Mobile Phone *</label>
                      <input
                        type="tel"
                        placeholder="(201) 555-0144"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-forest-800 focus:outline-none"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                      />
                      <span className="text-[10px] text-stone-500 block mt-1">Cabin counselors must be 18 or older.</span>
                    </div>
                  </div>
                </div>

                {/* Role Choice */}
                <div className="space-y-3 pt-2">
                  <b className="text-sm font-display font-extrabold text-stone-900 block">2. Preferred Volunteer Role</b>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      onClick={() => setRole("Cabin Counselor")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        role === "Cabin Counselor"
                          ? "border-forest-800 bg-forest-50/70 shadow-xs"
                          : "border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <b className="text-xs text-stone-900 block">Cabin Counselor</b>
                      <span className="text-[10px] text-stone-500 block mt-1">Camper leadership & cabin devotions (18+).</span>
                    </div>

                    <div
                      onClick={() => setRole("Medical Team")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        role === "Medical Team"
                          ? "border-forest-800 bg-forest-50/70 shadow-xs"
                          : "border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <b className="text-xs text-stone-900 block">Medical Team (RN/MD)</b>
                      <span className="text-[10px] text-stone-500 block mt-1">Health Lodge medication dispensing.</span>
                    </div>

                    <div
                      onClick={() => setRole("Kitchen Support")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        role === "Kitchen Support"
                          ? "border-forest-800 bg-forest-50/70 shadow-xs"
                          : "border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <b className="text-xs text-stone-900 block">Kitchen & Facilities</b>
                      <span className="text-[10px] text-stone-500 block mt-1">Meal prep, allergen tables, & grounds ops.</span>
                    </div>
                  </div>
                </div>

                {/* Reference Module */}
                <div className="bg-sun-50/90 border border-sun-200/80 p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-sun-800 tracking-wider">
                    <PhoneCall className="w-4 h-4 text-sun-700" />
                    <span>3. Pastor or Professional Reference</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Give us someone who can speak to your character. Reference checks are reviewed by the camp director; automated KaiCalls voice interviews are coming, but today a person makes the call.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      className="p-3 rounded-xl border border-sun-200 bg-white text-xs focus:border-forest-800 focus:outline-none"
                      value={refName}
                      onChange={(e) => setRefName(e.target.value)}
                      placeholder="e.g. Pastor David Keller"
                      required
                    />
                    <input
                      type="tel"
                      className="p-3 rounded-xl border border-sun-200 bg-white text-xs font-mono focus:border-forest-800 focus:outline-none"
                      value={refPhone}
                      onChange={(e) => setRefPhone(e.target.value)}
                      placeholder="Reference Mobile Phone: (908) 555-0199"
                      required
                    />
                    <input
                      type="email"
                      className="p-3 rounded-xl border border-sun-200 bg-white text-xs focus:border-forest-800 focus:outline-none"
                      value={refEmail}
                      onChange={(e) => setRefEmail(e.target.value)}
                      placeholder="Reference Email: pastor@church.org"
                      required
                    />
                    <input
                      type="text"
                      className="p-3 rounded-xl border border-sun-200 bg-white text-xs focus:border-forest-800 focus:outline-none"
                      value={refRelationship}
                      onChange={(e) => setRefRelationship(e.target.value)}
                      placeholder="How do they know you? e.g. Pastor, former supervisor"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <b className="text-xs font-black text-red-900 block">Application not saved</b>
                      <span className="text-xs text-red-800 block">{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-agency w-full justify-center text-xs py-4 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving your application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}

/** useSearchParams() needs a Suspense boundary; see RegisterPage for why. */
export default function VolunteerPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-4 py-20 text-center text-sm font-bold text-stone-500">
          Loading application…
        </main>
      }
    >
      <VolunteerPageInner />
    </Suspense>
  );
}
