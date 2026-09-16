"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Upload,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Check
} from "lucide-react";
import type { RegisterPayload, RegisterResponse } from "@/lib/formContracts";
import { CampScopeBlocker, useCampScope } from "@/components/CampScope";

/**
 * Which camp this registration belongs to now comes from ?camp=<slug> (the
 * parameter /c/<slug> already puts on its links). The route refuses a
 * registration it cannot attach to a real camp, so the form refuses to render
 * one too — rather than collecting a child's medical history and then losing it.
 */
function RegisterPageInner() {
  const campScope = useCampScope();
  const [step, setStep] = useState(1);
  const [session, setSession] = useState("session-1");
  const [paymentPlan, setPaymentPlan] = useState("installment_3mo");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State. Every key here is either sent to /api/register under this exact
  // name (see src/lib/formContracts.ts) or is a local-only UI value — nothing
  // is collected and then dropped.
  const [formData, setFormData] = useState({
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    parentStreet: "",
    parentCity: "",
    parentState: "PA",
    parentZip: "",
    relationship: "Mother",
    camperFirstName: "",
    camperLastName: "",
    camperDob: "",
    camperGender: "female",
    camperGrade: "5",
    cabinBuddy: "",
    peanutAllergy: false,
    dietaryRestrictions: "",
    epipen: false,
    inhaler: false,
    medicalConditions: "",
    primaryPhysician: "",
    physicianPhone: "",
    insuranceCarrier: "",
    policyNumber: "",
    groupNumber: "",
    // Local-only: the wizard shows the chosen filename. File upload to storage
    // is not implemented, so these are deliberately NOT sent or persisted.
    immunizationFile: "",
    cardFrontFile: "",
    cardBackFile: "",
    emergencyAuth: false,
    waterfrontConsent: false,
    signature: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // TODO: file upload. This only records the chosen filename for display.
  // Nothing is uploaded to storage yet, so /api/register deliberately does not
  // write a card_front_url / card_back_url — a filename is not a URL.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, [field]: e.target.files![0].name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (campScope.status !== "found") {
        setError("This registration is not attached to a camp. Nothing was saved.");
        return;
      }

      const payload: RegisterPayload = {
        campSlug: campScope.slug,
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        parentStreet: formData.parentStreet,
        parentCity: formData.parentCity,
        parentState: formData.parentState,
        parentZip: formData.parentZip,
        relationship: formData.relationship,
        sessionSlug: session,
        camperFirstName: formData.camperFirstName,
        camperLastName: formData.camperLastName,
        camperDob: formData.camperDob,
        camperGender: formData.camperGender,
        camperGrade: formData.camperGrade,
        cabinBuddy: formData.cabinBuddy,
        peanutAllergy: formData.peanutAllergy,
        epipen: formData.epipen,
        inhaler: formData.inhaler,
        dietaryRestrictions: formData.dietaryRestrictions,
        medicalConditions: formData.medicalConditions,
        primaryPhysician: formData.primaryPhysician,
        physicianPhone: formData.physicianPhone,
        insuranceCarrier: formData.insuranceCarrier,
        policyNumber: formData.policyNumber,
        groupNumber: formData.groupNumber,
        paymentPlan,
        emergencyAuth: formData.emergencyAuth,
        waterfrontConsent: formData.waterfrontConsent,
        signature: formData.signature
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data: RegisterResponse = await res.json().catch(() => ({ success: false }));

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "We could not save this registration. Please try again or call the camp office.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error — your registration was not saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Household" },
    { num: 2, title: "Camper" },
    { num: 3, title: "Medical" },
    { num: 4, title: "Insurance" },
    { num: 5, title: "Review" }
  ];

  if (campScope.status !== "found") {
    return <CampScopeBlocker scope={campScope} what="registration" />;
  }

  if (submitted) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900">
          Camper Registration Confirmed!
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto">
          We saved {formData.camperFirstName || "your camper"}&apos;s registration with {campScope.name}. The camp office will follow up at {formData.parentEmail || "the email you provided"} to confirm your spot and payment schedule.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/portal" className="btn-primary-agency text-xs py-3 px-6">
            Go to Parent Portal
          </Link>
          <Link href="/" className="px-6 py-3 rounded-full bg-stone-100 text-stone-800 font-bold text-xs">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      
      {/* HEADER & MOBILE PROGRESS BAR */}
      <div className="space-y-4 text-center sm:text-left sm:flex sm:items-end sm:justify-between sm:space-y-0">
        <div>
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {campScope.name} • /c/{campScope.slug}
          </span>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-stone-900 mt-2">
            Camper Registration
          </h1>
        </div>

        {/* COMPACT PROGRESS */}
        <div className="bg-stone-100 p-2 sm:p-3 rounded-2xl border border-stone-200 flex items-center gap-2">
          <span className="text-xs font-black text-stone-700">Step {step} of 5:</span>
          <span className="text-xs font-extrabold text-forest-900">{steps[step - 1].title}</span>
          <div className="w-20 bg-stone-200 h-2 rounded-full overflow-hidden ml-1">
            <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* STEP TABS (DESKTOP) */}
      <div className="hidden sm:grid grid-cols-5 gap-2 border-b border-stone-200 pb-4">
        {steps.map(s => (
          <button
            key={s.num}
            type="button"
            onClick={() => s.num < step && setStep(s.num)}
            className={`p-3 rounded-xl text-left border transition-all ${
              step === s.num
                ? "bg-forest-900 text-white border-forest-900 shadow-sm"
                : s.num < step
                ? "bg-emerald-50 text-emerald-950 border-emerald-200 cursor-pointer"
                : "bg-stone-50 text-stone-400 border-stone-200"
            }`}
          >
            <span className="text-[10px] font-bold block opacity-80">STEP 0{s.num}</span>
            <span className="text-xs font-black block">{s.title}</span>
          </button>
        ))}
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 border-2 border-stone-200 shadow-lg space-y-6 sm:space-y-8">
        
        {/* STEP 1: HOUSEHOLD & GUARDIAN */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl text-stone-900">
                1. Parent / Guardian Household Information
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">Primary contact for invoices, medical authorizations, and emergency updates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Parent First Name *</label>
                <input
                  type="text"
                  name="parentFirstName"
                  required
                  placeholder="e.g. Sarah"
                  value={formData.parentFirstName}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Parent Last Name *</label>
                <input
                  type="text"
                  name="parentLastName"
                  required
                  placeholder="e.g. Miller"
                  value={formData.parentLastName}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Parent Email Address *</label>
                <input
                  type="email"
                  name="parentEmail"
                  required
                  placeholder="sarah.miller@example.com"
                  value={formData.parentEmail}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Mobile Phone Number (for 1-Tap SMS) *</label>
                <input
                  type="tel"
                  name="parentPhone"
                  required
                  placeholder="(555) 234-5678"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Relationship to Camper *</label>
                <select
                  name="relationship"
                  required
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base bg-white focus:border-forest-800 focus:outline-none"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Street Address *</label>
              <input
                type="text"
                name="parentStreet"
                required
                placeholder="142 Meadow Lane"
                value={formData.parentStreet}
                onChange={handleInputChange}
                className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs sm:text-sm font-bold text-stone-800">City *</label>
                <input
                  type="text"
                  name="parentCity"
                  required
                  placeholder="Lancaster"
                  value={formData.parentCity}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">State *</label>
                <input
                  type="text"
                  name="parentState"
                  required
                  placeholder="PA"
                  value={formData.parentState}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Zip Code *</label>
                <input
                  type="text"
                  name="parentZip"
                  required
                  placeholder="17601"
                  value={formData.parentZip}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Continue to Camper Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CAMPER DETAILS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl text-stone-900">
                2. Camper Information & Session Choice
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">Select your week and tell us about your camper.</p>
            </div>

            {/* SESSION CARDS */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Choose Summer 2027 Session *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setSession("session-1")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    session === "session-1" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">Junior (Grades 2–4)</b>
                  <span className="text-[11px] text-stone-600 block">July 11–17 • $650</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-2">8 Spots Left</span>
                </div>
                <div
                  onClick={() => setSession("session-2")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    session === "session-2" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">Intermediate (5–6)</b>
                  <span className="text-[11px] text-stone-600 block">July 18–24 • $650</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-2">14 Spots Left</span>
                </div>
                <div
                  onClick={() => setSession("session-3")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    session === "session-3" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">Senior Teen (7–8)</b>
                  <span className="text-[11px] text-stone-600 block">July 25–31 • $675</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-2">6 Spots Left</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Camper First Name *</label>
                <input
                  type="text"
                  name="camperFirstName"
                  required
                  placeholder="e.g. Jamie"
                  value={formData.camperFirstName}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Camper Last Name *</label>
                <input
                  type="text"
                  name="camperLastName"
                  required
                  placeholder="e.g. Miller"
                  value={formData.camperLastName}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Date of Birth *</label>
                <input
                  type="date"
                  name="camperDob"
                  required
                  value={formData.camperDob}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Camper Gender *</label>
                <select
                  name="camperGender"
                  required
                  value={formData.camperGender}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base bg-white focus:border-forest-800 focus:outline-none"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <p className="text-[11px] text-stone-500">Used for cabin assignment only.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Grade Entering (Fall 2027) *</label>
                <select
                  name="camperGrade"
                  required
                  value={formData.camperGrade}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base bg-white focus:border-forest-800 focus:outline-none"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(g => (
                    <option key={g} value={String(g)}>{g}th Grade</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Cabin Buddy Request (Optional)</label>
                <input
                  type="text"
                  name="cabinBuddy"
                  placeholder="Friend's First & Last Name"
                  value={formData.cabinBuddy}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Continue to Medical & Allergies</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MEDICAL & ALLERGIES */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl text-stone-900">
                3. Health Lodge & Allergy Profile
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">Encrypted and accessible only by licensed Camp Hope Health Lodge RNs.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <b className="text-xs sm:text-sm font-extrabold text-amber-950 block">Allergy & Rescue Medication Alerts</b>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="peanutAllergy"
                    checked={formData.peanutAllergy}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-900">Peanut / Nut Allergy</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="epipen"
                    checked={formData.epipen}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-900">Carries EpiPen</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="inhaler"
                    checked={formData.inhaler}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-900">Carries Inhaler</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Dietary Restrictions or Special Nutrition Notes</label>
              <textarea
                name="dietaryRestrictions"
                rows={2}
                placeholder="e.g. Gluten-free, dairy allergy, vegetarian..."
                value={formData.dietaryRestrictions}
                onChange={handleInputChange}
                className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Other Medical Conditions or Daily Medications</label>
              <textarea
                name="medicalConditions"
                rows={2}
                placeholder="e.g. Asthma, ADHD medication at breakfast, bee sting sensitivity..."
                value={formData.medicalConditions}
                onChange={handleInputChange}
                className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Primary Physician</label>
                <input
                  type="text"
                  name="primaryPhysician"
                  placeholder="e.g. Dr. Anita Rao"
                  value={formData.primaryPhysician}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Physician Phone</label>
                <input
                  type="tel"
                  name="physicianPhone"
                  placeholder="(555) 234-5678"
                  value={formData.physicianPhone}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Upload Immunization Record (PDF or Photo)</label>
              <label className="border-2 border-dashed border-stone-300 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors">
                <Upload className="w-6 h-6 text-stone-400" />
                <span className="text-xs sm:text-sm font-extrabold text-forest-900">
                  {formData.immunizationFile || "Tap to select immunization PDF or take photo"}
                </span>
                <span className="text-[11px] text-stone-400">Supported: PDF, JPG, PNG (Max 15MB)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, "immunizationFile")}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Continue to Insurance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: INSURANCE & CARD UPLOADS */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl text-stone-900">
                4. Health Insurance Policy & Card Capture
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">Used in the rare event of off-site emergency medical care.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Insurance Carrier *</label>
                <input
                  type="text"
                  name="insuranceCarrier"
                  required
                  placeholder="e.g. Blue Cross Blue Shield"
                  value={formData.insuranceCarrier}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Policy / Member ID *</label>
                <input
                  type="text"
                  name="policyNumber"
                  required
                  placeholder="e.g. BCB-9988112"
                  value={formData.policyNumber}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Group Number</label>
                <input
                  type="text"
                  name="groupNumber"
                  placeholder="e.g. G-48201"
                  value={formData.groupNumber}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="border-2 border-dashed border-stone-300 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors">
                <Upload className="w-5 h-5 text-stone-400" />
                <span className="text-xs sm:text-sm font-extrabold text-forest-900">
                  {formData.cardFrontFile || "Front of Insurance Card"}
                </span>
                <span className="text-[11px] text-stone-400">Take photo with phone or upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cardFrontFile")}
                  className="hidden"
                />
              </label>

              <label className="border-2 border-dashed border-stone-300 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors">
                <Upload className="w-5 h-5 text-stone-400" />
                <span className="text-xs sm:text-sm font-extrabold text-forest-900">
                  {formData.cardBackFile || "Back of Insurance Card"}
                </span>
                <span className="text-[11px] text-stone-400">Take photo with phone or upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cardBackFile")}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-900 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Continue to Waivers & Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW, WAIVERS & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl text-stone-900">
                5. Payment Schedule & Legal Authorizations
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">Select your installment structure and sign electronically.</p>
            </div>

            {/* PAYMENT OPTIONS */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Select Tuition Schedule *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setPaymentPlan("installment_3mo")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentPlan === "installment_3mo" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">3-Month Plan (Recommended)</b>
                  <span className="text-xs text-stone-600 block mt-1">$100 today + $275/mo</span>
                </div>
                <div
                  onClick={() => setPaymentPlan("deposit_only")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentPlan === "deposit_only" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">Deposit Only</b>
                  <span className="text-xs text-stone-600 block mt-1">$100 today (balance due June 1)</span>
                </div>
                <div
                  onClick={() => setPaymentPlan("pay_in_full")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentPlan === "pay_in_full" ? "border-forest-800 bg-forest-50 shadow-sm" : "border-stone-200 bg-white"
                  }`}
                >
                  <b className="text-xs sm:text-sm font-black text-stone-900 block">Pay in Full</b>
                  <span className="text-xs text-stone-600 block mt-1">$650 single payment</span>
                </div>
              </div>
            </div>

            {/* LEGAL WAIVERS */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="emergencyAuth"
                  required
                  checked={formData.emergencyAuth}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-emerald-600 rounded mt-0.5"
                />
                <span className="text-xs sm:text-sm text-stone-800 font-bold">
                  I hereby authorize Camp Hope staff and licensed health personnel to administer first aid and emergency medical treatment. *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="waterfrontConsent"
                  required
                  checked={formData.waterfrontConsent}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-emerald-600 rounded mt-0.5"
                />
                <span className="text-xs sm:text-sm text-stone-800 font-bold">
                  I grant permission for my child to participate in supervised lake swimming, kayaking, and outdoor ropes activities. *
                </span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800">Parent / Guardian Typed Legal Signature *</label>
              <input
                type="text"
                name="signature"
                required
                placeholder="Type your full legal name (e.g. Sarah Miller)"
                value={formData.signature}
                onChange={handleInputChange}
                className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <b className="text-xs sm:text-sm font-black text-red-900 block">Registration not saved</b>
                  <span className="text-xs text-red-800 block">{error}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting to Database...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Complete Registration & Secure Spot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>
    </main>
  );
}

/**
 * useSearchParams() lives inside RegisterPageInner, so it needs a Suspense
 * boundary or the whole route opts out of static rendering at build time.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-4 py-20 text-center text-sm font-bold text-stone-500">
          Loading registration…
        </main>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
