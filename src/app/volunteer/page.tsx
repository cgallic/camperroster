"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCall, CheckCircle2, ArrowRight, Loader2, ArrowLeft, HeartHandshake, ShieldCheck } from "lucide-react";

export default function VolunteerPage() {
  const [role, setRole] = useState("Cabin Counselor");
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !refName || !refPhone) {
      alert("Please fill out all applicant and reference fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, refName, refPhone, name, email, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setAppId(data.applicationId);
        setSubmitted(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Camp Hope Home</span>
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
                <h2 className="font-display font-black text-2xl text-forest-950">Application Saved in Supabase!</h2>
                <p className="text-xs text-stone-700 max-w-md mx-auto leading-relaxed">
                  Thank you, <b>{name}</b>! KaiCalls AI Voice Assistant has queued an automated 2-minute reference phone interview to <b>{refName}</b> ({refPhone}).
                </p>
                <div className="font-mono text-xs text-forest-800 bg-white p-3 rounded-xl border border-forest-200 max-w-sm mx-auto">
                  Application UUID: {appId || "66666666-6666-6666-6666-666666666666"}
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
                    KaiCalls AI Voice Assistant calls your reference for a 2-minute safety interview and transcribes the recording directly for our camp director.
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
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-agency w-full justify-center text-xs py-4 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Application to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application & Trigger Reference Call</span>
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
