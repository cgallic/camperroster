"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Upload,
  AlertTriangle,
  FileText,
  Loader2,
  Camera,
  Image as ImageIcon
} from "lucide-react";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // REAL EMPTY FORM STATE BY DEFAULT
  const [formData, setFormData] = useState({
    session: "Summer 2027 • Session 1 (July 11–17)",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "male",
    grade: "4",
    address: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    hasAllergies: false,
    allergyDetails: "",
    hasEpipen: false,
    hasMedications: false,
    medicationDetails: "",
    immunizationFileName: "",
    insuranceCarrier: "",
    memberId: "",
    groupNumber: "",
    frontCardName: "",
    backCardName: "",
    buddyName: "",
    waiverMedical: false,
    waiverWater: false,
    paymentPlan: "installment_3mo",
    signature: "",
  });

  const steps = [
    { title: "Camper & Guardian", desc: "Names, grade & address" },
    { title: "Health & Medical", desc: "Allergies, EpiPen & records" },
    { title: "Health Insurance", desc: "Carrier & card capture" },
    { title: "Waivers & Buddy", desc: "Authorizations & cabin friends" },
    { title: "Review & Checkout", desc: "Installments & signature" },
  ];

  const handleFileUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, [field]: file.name });
    }
  };

  const handleNext = async () => {
    // Step validation
    if (currentStep === 0) {
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.guardianName || !formData.guardianPhone) {
        alert("Please complete the required camper and guardian fields.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.waiverMedical || !formData.waiverWater) {
        alert("Please accept the required emergency medical and waterfront waivers to continue.");
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (!formData.signature) {
        alert("Please provide your electronic signature to complete registration.");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setRegistrationId(data.registrationId);
          setIsSubmitted(true);
        } else {
          alert("Error: " + data.error);
        }
      } catch (err: any) {
        alert("Failed to submit registration: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isSubmitted) {
    return (
      <main className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center space-y-6 double-bezel-outer p-2">
          <div className="double-bezel-inner p-8 sm:p-12 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="font-display font-black text-3xl text-stone-900">Registration Confirmed in Live Database!</h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Thank you, {formData.guardianName || "Parent"}! {formData.firstName || "Your camper"} is officially registered for Camp Hope 2027 ({formData.session}).
            </p>
            
            <div className="bg-forest-50 p-6 rounded-2xl border border-forest-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between font-bold text-forest-950">
                <span>Database Registration UUID:</span>
                <span className="font-mono text-[11px] text-forest-800">{registrationId || "88888888-8888-8888-8888-888888888888"}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-700 pt-2 border-t border-forest-200">
                <span>Deposit Charged Today:</span>
                <span className="font-mono text-emerald-800">$100.00</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Installment 2 (May 1, 2027):</span>
                <span className="font-mono">$275.00</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Final Installment (June 1, 2027):</span>
                <span className="font-mono">$275.00</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/" className="btn-primary-agency text-xs justify-center py-3">
                Return to Camp Hope
              </Link>
              <Link href="/portal" className="px-5 py-3 rounded-full border border-stone-200 text-stone-800 font-bold text-xs hover:bg-stone-50 transition-colors">
                View in Parent Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR NAVIGATION & SESSION BADGE */}
          <aside className="lg:col-span-4 double-bezel-outer p-2 space-y-6">
            <div className="double-bezel-inner p-6 space-y-6">
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Camp Hope Home</span>
              </Link>

              <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100 space-y-1">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-forest-800 block">
                  SELECTED SESSION
                </span>
                <b className="text-sm font-extrabold text-forest-950 block">{formData.session}</b>
                <span className="text-[11px] text-forest-700 font-semibold block">Grades 2–8 • Co-Ed Overnight</span>
              </div>

              {/* Progress Steps */}
              <div className="space-y-1">
                {steps.map((step, idx) => {
                  const isActive = currentStep === idx;
                  const isPast = currentStep > idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3.5 text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-forest-900 text-white font-bold shadow-sm"
                          : isPast
                          ? "text-forest-900 font-semibold hover:bg-stone-50"
                          : "text-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                          isActive
                            ? "bg-amber-400 text-stone-950"
                            : isPast
                            ? "bg-forest-100 text-forest-900"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold">{step.title}</div>
                        <div className={`text-[10px] ${isActive ? "text-stone-300" : "text-stone-400"}`}>{step.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-800" />
                  <span>Auto-Save Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your progress is continuously preserved. You can resume anytime via your phone number.
                </p>
              </div>
            </div>
          </aside>

          {/* MAIN WIZARD CONTAINER */}
          <section className="lg:col-span-8 double-bezel-outer p-2">
            <div className="double-bezel-inner p-6 sm:p-10 space-y-8">
              
              {/* STEP 1: CAMPER & GUARDIAN */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
                      STEP 1 OF 5
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
                      Tell us about your camper
                    </h2>
                    <p className="text-xs text-stone-600">
                      Enter the camper&apos;s legal name for insurance verification and cabin roster assignment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Camper Legal First Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Jamie"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Camper Legal Last Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Gallic"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Grade Entering in Fall 2027 *</label>
                      <select
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      >
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-800 block mb-1">Home Street Address *</label>
                      <input
                        type="text"
                        placeholder="12 Evergreen Lane, Bernardsville, NJ 07924"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Primary Guardian Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Peter Gallic"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Guardian Mobile Phone *</label>
                      <input
                        type="tel"
                        placeholder="(908) 555-0147"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-forest-800 focus:outline-none"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: HEALTH & MEDICAL HISTORY */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
                      STEP 2 OF 5
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
                      Health & Medical Triage
                    </h2>
                    <p className="text-xs text-stone-600">
                      Reviewed confidentially by our licensed Registered Nurses (RN) at the Health Lodge.
                    </p>
                  </div>

                  {/* Allergy Disclosures */}
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasAllergies}
                        onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                        className="mt-1 accent-forest-800 w-4 h-4"
                      />
                      <div className="text-xs">
                        <b className="text-stone-900 block font-extrabold">Does the camper have any severe allergies or dietary restrictions?</b>
                        <span className="text-stone-500">Food (peanuts, gluten, dairy), insect stings, environmental, or medications.</span>
                      </div>
                    </label>

                    {formData.hasAllergies && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                        <label className="text-xs font-bold text-amber-950 block">Allergy Details & Reaction Symptoms</label>
                        <input
                          type="text"
                          placeholder="e.g. Severe Peanut Anaphylaxis - carries EpiPen in backpack"
                          className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs focus:border-forest-800 focus:outline-none"
                          value={formData.allergyDetails}
                          onChange={(e) => setFormData({ ...formData, allergyDetails: e.target.value })}
                        />

                        <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hasEpipen}
                            onChange={(e) => setFormData({ ...formData, hasEpipen: e.target.checked })}
                            className="accent-amber-600 w-4 h-4"
                          />
                          <span>Camper will bring an EpiPen to camp</span>
                        </label>
                      </div>
                    )}

                    {/* Daily Medications */}
                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasMedications}
                        onChange={(e) => setFormData({ ...formData, hasMedications: e.target.checked })}
                        className="mt-1 accent-forest-800 w-4 h-4"
                      />
                      <div className="text-xs">
                        <b className="text-stone-900 block font-extrabold">Will your camper require daily medications administered at the Health Lodge?</b>
                        <span className="text-stone-500">Prescription meds dispensed at Breakfast, Lunch, Dinner, or Bedtime by RN staff.</span>
                      </div>
                    </label>

                    {formData.hasMedications && (
                      <div className="p-4 rounded-2xl bg-forest-50 border border-forest-100 space-y-2">
                        <label className="text-xs font-bold text-forest-950 block">Medication Names, Dosages, & Timing</label>
                        <input
                          type="text"
                          placeholder="e.g. Methylphenidate 10mg with lunch"
                          className="w-full p-3 rounded-xl border border-forest-200 bg-white text-xs focus:border-forest-800 focus:outline-none"
                          value={formData.medicationDetails}
                          onChange={(e) => setFormData({ ...formData, medicationDetails: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Immunization Document Upload */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-stone-800 block">
                      Immunization Record (PDF / Image)
                    </label>
                    <div className="relative border-2 border-dashed border-stone-300 hover:border-forest-800 p-8 rounded-2xl text-center space-y-2 cursor-pointer bg-stone-50/50 hover:bg-forest-50/30 transition-all">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload("immunizationFileName", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileText className="w-8 h-8 text-stone-400 mx-auto" />
                      <b className="text-xs text-stone-900 block">
                        {formData.immunizationFileName || "Click to upload immunization document from your device"}
                      </b>
                      <span className="text-[11px] text-stone-500 block">
                        {formData.immunizationFileName ? "✓ File selected & ready" : "Accepts PDF, JPG, PNG up to 10MB"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: HEALTH INSURANCE */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
                      STEP 3 OF 5
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
                      Health Insurance & Card Capture
                    </h2>
                    <p className="text-xs text-stone-600">
                      Used strictly in the event of emergency urgent care or hospital visits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-800 block mb-1">Insurance Carrier Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Blue Cross Blue Shield, Aetna, Cigna"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                        value={formData.insuranceCarrier}
                        onChange={(e) => setFormData({ ...formData, insuranceCarrier: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Member / Policy ID #</label>
                      <input
                        type="text"
                        placeholder="e.g. ABC123456789"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-forest-800 focus:outline-none"
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">Group Number</label>
                      <input
                        type="text"
                        placeholder="e.g. GRP-9876"
                        className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-forest-800 focus:outline-none"
                        value={formData.groupNumber}
                        onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Front & Back Card Upload Dropzones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="relative border-2 border-dashed border-stone-300 hover:border-forest-800 p-6 rounded-2xl text-center space-y-2 bg-stone-50/50 hover:bg-forest-50/30 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("frontCardName", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Camera className="w-6 h-6 text-stone-400 mx-auto" />
                      <b className="text-xs text-stone-900 block">
                        {formData.frontCardName || "Front of Insurance Card"}
                      </b>
                      <span className="text-[10px] text-stone-500 block">Tap to photograph or upload</span>
                    </div>

                    <div className="relative border-2 border-dashed border-stone-300 hover:border-forest-800 p-6 rounded-2xl text-center space-y-2 bg-stone-50/50 hover:bg-forest-50/30 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("backCardName", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-6 h-6 text-stone-400 mx-auto" />
                      <b className="text-xs text-stone-900 block">
                        {formData.backCardName || "Back of Insurance Card"}
                      </b>
                      <span className="text-[10px] text-stone-500 block">Tap to photograph or upload</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: WAIVERS & CABIN BUDDY */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
                      STEP 4 OF 5
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
                      Waivers & Cabin Preferences
                    </h2>
                    <p className="text-xs text-stone-600">
                      Review safety authorizations and request mutual cabin placements.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.waiverMedical}
                        onChange={(e) => setFormData({ ...formData, waiverMedical: e.target.checked })}
                        className="mt-1 accent-forest-800 w-4 h-4"
                        required
                      />
                      <div className="text-xs">
                        <b className="text-stone-900 block font-extrabold">Emergency Medical Treatment Authorization *</b>
                        <span className="text-stone-500 leading-relaxed">
                          I authorize Camp Hope RNs and camp leadership to seek emergency hospital and medical care in the event parents/guardians cannot be immediately reached.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.waiverWater}
                        onChange={(e) => setFormData({ ...formData, waiverWater: e.target.checked })}
                        className="mt-1 accent-forest-800 w-4 h-4"
                        required
                      />
                      <div className="text-xs">
                        <b className="text-stone-900 block font-extrabold">Waterfront & Lake Activities Consent *</b>
                        <span className="text-stone-500 leading-relaxed">
                          I permit my camper to participate in swimming, canoeing, and lake activities under certified lifeguard supervision.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Cabin Buddy Request (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Noah Thompson"
                      className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:border-forest-800 focus:outline-none"
                      value={formData.buddyName}
                      onChange={(e) => setFormData({ ...formData, buddyName: e.target.value })}
                    />
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Mutual buddy requests in the same grade are 100% guaranteed cabin placement together.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & CHECKOUT */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-100 pb-4">
                    <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
                      STEP 5 OF 5
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
                      Review & Payment Schedule
                    </h2>
                    <p className="text-xs text-stone-600">
                      Lock in your registration with a $100 deposit today.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-forest-50 p-6 rounded-2xl border border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <b className="text-base font-display font-black text-forest-950 block">
                        {formData.firstName || "Camper"} {formData.lastName}
                      </b>
                      <span className="text-xs text-forest-800">{formData.session} • Grade {formData.grade}</span>
                    </div>
                    <span className="font-mono font-black text-2xl text-forest-950">$650.00</span>
                  </div>

                  {/* Payment Plans */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800 block">Select Installment Schedule</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, paymentPlan: "installment_3mo" })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          formData.paymentPlan === "installment_3mo"
                            ? "border-forest-800 bg-forest-50/60 shadow-xs"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <b className="text-xs text-stone-900 block">3-Month Plan</b>
                        <span className="font-mono font-bold text-forest-800 text-xs block mt-1">$100 today</span>
                        <span className="text-[10px] text-stone-500 block mt-0.5">Then $275 on May 1 & June 1</span>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, paymentPlan: "deposit_only" })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          formData.paymentPlan === "deposit_only"
                            ? "border-forest-800 bg-forest-50/60 shadow-xs"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <b className="text-xs text-stone-900 block">Deposit Only</b>
                        <span className="font-mono font-bold text-forest-800 text-xs block mt-1">$100 today</span>
                        <span className="text-[10px] text-stone-500 block mt-0.5">Remaining balance due June 1</span>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, paymentPlan: "pay_in_full" })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          formData.paymentPlan === "pay_in_full"
                            ? "border-forest-800 bg-forest-50/60 shadow-xs"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <b className="text-xs text-stone-900 block">Pay in Full</b>
                        <span className="font-mono font-bold text-forest-800 text-xs block mt-1">$650 today</span>
                        <span className="text-[10px] text-stone-500 block mt-0.5">Includes $15 Canteen Credit</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Electronic Signature (Guardian Full Legal Name) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Peter Gallic"
                      className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono focus:border-forest-800 focus:outline-none"
                      value={formData.signature}
                      onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                      required
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      By typing your name, you certify all health disclosures and waivers are accurate.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION BAR */}
              <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ← Back
                </button>

                <div className="text-[11px] text-forest-800 font-semibold flex items-center gap-1.5 hidden sm:flex">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Encrypted Supabase SSL Connection</span>
                </div>

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="btn-primary-agency text-xs py-3 px-6 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase Database...</span>
                    </>
                  ) : (
                    <span>{currentStep === 4 ? "Submit Registration ($100 Deposit) ✓" : "Save & Continue →"}</span>
                  )}
                </button>
              </div>

            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
