"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Mail,
  QrCode,
  DollarSign,
  Download,
  Plus,
  Send,
  Camera,
  Heart,
  FileText,
  User,
  Shield,
  Sparkles,
  PhoneCall,
  Clock,
  Check
} from "lucide-react";

export default function ParentPortalPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "bunk_notes" | "photos" | "packing" | "canteen">("overview");
  
  const [noteText, setNoteText] = useState("");
  const [noteDeliveryDate, setNoteDeliveryDate] = useState("2027-07-13");
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [notesList, setNotesList] = useState([
    {
      id: "n-1",
      sender: "Mom & Dad",
      message: "Have an amazing time canoeing today Jamie! We are so proud of you and love you so much!",
      delivery_date: "July 12, 2027",
      status: "Delivered at 11:00 AM Mail Call"
    }
  ]);

  const [canteenBalance, setCanteenBalance] = useState(35.00);
  const [reloadingWallet, setReloadingWallet] = useState(false);
  const [canteenSuccess, setCanteenSuccess] = useState("");

  const [packingList, setPackingList] = useState([
    { id: 1, item: "Sleeping bag & twin fitted sheet", category: "Bedding", checked: true },
    { id: 2, item: "Pillow & pillowcase", category: "Bedding", checked: true },
    { id: 3, item: "2 Beach towels + 1 bath towel", category: "Waterfront", checked: true },
    { id: 4, item: "Modest one-piece swimsuit / swim trunks", category: "Waterfront", checked: false },
    { id: 5, item: "6 pairs socks & underwear", category: "Clothing", checked: true },
    { id: 6, item: "2 pairs closed-toe sneakers (required for ropes course)", category: "Footwear", checked: true },
    { id: 7, item: "Water sandals / Crocs (for lake dock only)", category: "Footwear", checked: false },
    { id: 8, item: "Bible, notebook & pen", category: "Cabin Life", checked: true },
    { id: 9, item: "Flashlight with extra batteries", category: "Cabin Life", checked: false },
    { id: 10, item: "Bug spray (DEET free) & SPF 50 sunscreen", category: "Health", checked: true },
    { id: 11, item: "EpiPen (2-pack in original pharmacy box)", category: "Health", checked: true },
    { id: 12, item: "Reusable 32oz water bottle with name", category: "Daily", checked: true }
  ]);

  const togglePacking = (id: number) => {
    setPackingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleSendBunkNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setNotesList(prev => [
      {
        id: `n-${Date.now()}`,
        sender: "Mom & Dad",
        message: noteText,
        delivery_date: "July 13, 2027",
        status: "Scheduled for 11:00 AM Cabin Mail Call"
      },
      ...prev
    ]);
    setNoteText("");
    setNoteSubmitted(true);
    setTimeout(() => setNoteSubmitted(false), 4000);
  };

  const handleReloadCanteen = (amount: number) => {
    setReloadingWallet(true);
    setTimeout(() => {
      setCanteenBalance(prev => prev + amount);
      setReloadingWallet(false);
      setCanteenSuccess(`Added $${amount}.00 to Jamie's store wallet!`);
      setTimeout(() => setCanteenSuccess(""), 4000);
    }, 600);
  };

  const packingPercent = Math.round((packingList.filter(p => p.checked).length / packingList.length) * 100);

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* CAMPER HEADER & EXPRESS QR PASS */}
      <div className="bg-stone-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              CAMP HOPE • PARENT PORTAL
            </span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registered & Cleared</span>
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            Jamie Gallic
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-300 font-semibold">
            <span className="flex items-center gap-1.5 text-stone-200">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Session 1: July 11–17, 2027</span>
            </span>
            <span>•</span>
            <span className="text-stone-200">Cabin 4 • Timber Lodge</span>
            <span>•</span>
            <span className="text-stone-200">Counselor Sarah & Mark</span>
          </div>
        </div>

        {/* EXPRESS QR BOARDING PASS */}
        <div className="bg-white text-stone-950 p-4 rounded-2xl border-2 border-stone-200 shadow-lg flex items-center gap-4 shrink-0 max-w-sm">
          <div className="w-20 h-20 bg-stone-100 rounded-xl p-1 flex items-center justify-center border border-stone-200 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-stone-950 fill-current">
              <rect x="10" y="10" width="25" height="25" />
              <rect x="65" y="10" width="25" height="25" />
              <rect x="10" y="65" width="25" height="25" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="19" y="19" width="7" height="7" />
              <rect x="74" y="19" width="7" height="7" />
              <rect x="19" y="74" width="7" height="7" />
              <rect x="45" y="10" width="10" height="20" />
              <rect x="45" y="40" width="20" height="20" />
              <rect x="10" y="45" width="25" height="10" />
              <rect x="70" y="45" width="20" height="10" />
              <rect x="45" y="70" width="20" height="20" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] font-bold text-forest-800 uppercase block">
              OPENING DAY BOARDING PASS
            </span>
            <b className="text-xs font-black block text-stone-950">45-Sec Express Gate Check-In</b>
            <span className="text-[11px] text-stone-600 block">Show QR code to gate counselor</span>
          </div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "overview" ? "bg-forest-900 text-white shadow-sm" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          Camp Overview
        </button>
        <button
          onClick={() => setActiveTab("bunk_notes")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "bunk_notes" ? "bg-forest-900 text-white shadow-sm" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Bunk Notes (Parent Mail)</span>
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "photos" ? "bg-forest-900 text-white shadow-sm" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Daily Photos</span>
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "packing" ? "bg-forest-900 text-white shadow-sm" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Packing List ({packingPercent}%)</span>
        </button>
        <button
          onClick={() => setActiveTab("canteen")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "canteen" ? "bg-forest-900 text-white shadow-sm" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Canteen Store Wallet (${canteenBalance.toFixed(2)})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border-2 border-stone-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                HEALTH LODGE VERIFIED
              </span>
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-display font-black text-xl text-stone-900">Medical & Allergy Profile</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
              <li className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span>Peanut / Tree Nut Allergy</span>
                <b className="text-amber-700">Flagged (EpiPen Onsite)</b>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span>Immunization Record</span>
                <b className="text-emerald-700">Approved by RN</b>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
                <span>Insurance Card</span>
                <b className="text-emerald-700">On File (BCBS)</b>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border-2 border-stone-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-forest-800 bg-forest-100 px-3 py-1 rounded-full">
                CABIN PLACEMENT
              </span>
              <User className="w-5 h-5 text-forest-800" />
            </div>
            <h3 className="font-display font-black text-xl text-stone-900">Cabin 4 • Timber Lodge</h3>
            <div className="space-y-2 text-xs sm:text-sm text-stone-700">
              <p className="text-stone-600"><b>Counselors:</b> Mark Henderson & Sarah Jenkins</p>
              <p className="text-stone-600"><b>Mutual Buddy Match:</b> Matched with <i>Emma Gallic</i></p>
              <div className="p-3 rounded-xl bg-forest-50 border border-forest-200 text-forest-900 text-xs font-bold">
                Drop-off time: Sunday, July 11 @ 2:30 PM
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border-2 border-stone-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                ACCOUNT BALANCE
              </span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-display font-black text-xl text-stone-900">Tuition & Wallet</h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-600">Tuition ($650 Installment):</span>
                <b className="text-stone-900">$100 Deposit Paid</b>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-600">Next Auto-Pay:</span>
                <b className="text-stone-900">$275 on May 1</b>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-stone-600 font-bold">Canteen Store Wallet:</span>
                <b className="text-emerald-700 text-lg font-black">${canteenBalance.toFixed(2)}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUNK NOTES */}
      {activeTab === "bunk_notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-md space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display font-black text-2xl text-stone-900">Send a Daily Bunk Note</h2>
              <p className="text-xs sm:text-sm text-stone-600">Write a letter to Jamie! Directors print notes daily at 11:00 AM and deliver them to cabins during mail call.</p>
            </div>

            {noteSubmitted && (
              <div className="p-4 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Bunk Note scheduled for 11:00 AM daily cabin delivery!</span>
              </div>
            )}

            <form onSubmit={handleSendBunkNote} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Delivery Date</label>
                <select
                  value={noteDeliveryDate}
                  onChange={(e) => setNoteDeliveryDate(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 text-stone-900 text-sm focus:border-forest-800 focus:outline-none"
                >
                  <option value="2027-07-12">Monday, July 12, 2027 (11:00 AM Mail Call)</option>
                  <option value="2027-07-13">Tuesday, July 13, 2027 (11:00 AM Mail Call)</option>
                  <option value="2027-07-14">Wednesday, July 14, 2027 (11:00 AM Mail Call)</option>
                  <option value="2027-07-15">Thursday, July 15, 2027 (11:00 AM Mail Call)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Your Letter to Jamie</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Dear Jamie, we hope you are having the best time canoeing and roasting s'mores! Keep making great friends..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Send Letter for Mail Call</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-display font-black text-xl text-stone-900">Sent Letters</h3>
            <div className="space-y-3">
              {notesList.map((n) => (
                <div key={n.id} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <b className="font-bold text-stone-900">{n.sender}</b>
                    <span className="text-stone-500">{n.delivery_date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium bg-stone-50 p-3 rounded-xl border border-stone-100">
                    &quot;{n.message}&quot;
                  </p>
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{n.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHOTOS */}
      {activeTab === "photos" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-display font-black text-2xl text-stone-900">Private Daily Photo Gallery</h2>
              <p className="text-xs sm:text-sm text-stone-600">High-resolution photos taken by camp photographers during session 1.</p>
            </div>
            <span className="font-mono text-xs font-bold text-forest-900 bg-forest-100 px-3.5 py-1.5 rounded-full border border-forest-200">
              Session 1 • July 2027
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-md space-y-3">
              <div className="relative h-60 w-full">
                <Image src="/images/camp_hero.jpg" alt="Waterfront lake canoeing" fill className="object-cover" />
                <span className="absolute top-3 left-3 bg-black/70 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">Waterfront</span>
              </div>
              <div className="p-4 space-y-1">
                <b className="text-sm font-black text-stone-900 block">Morning Lake Canoeing</b>
                <p className="text-xs text-stone-600">Campers practicing tandem paddle strokes at Golden Hour.</p>
                <span className="text-[11px] font-bold text-stone-400 block pt-1">July 12, 2027 • 9:30 AM</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-md space-y-3">
              <div className="relative h-60 w-full">
                <Image src="/images/camp_campfire.jpg" alt="Evening campfire" fill className="object-cover" />
                <span className="absolute top-3 left-3 bg-black/70 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">Evening Program</span>
              </div>
              <div className="p-4 space-y-1">
                <b className="text-sm font-black text-stone-900 block">Campfire & Worship Fellowship</b>
                <p className="text-xs text-stone-600">Roasting marshmallows and acoustic worship singing.</p>
                <span className="text-[11px] font-bold text-stone-400 block pt-1">July 12, 2027 • 8:15 PM</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-md space-y-3">
              <div className="relative h-60 w-full">
                <Image src="/images/camp_cabin.jpg" alt="Cabin 4 timber lodge" fill className="object-cover" />
                <span className="absolute top-3 left-3 bg-black/70 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">Cabin Life</span>
              </div>
              <div className="p-4 space-y-1">
                <b className="text-sm font-black text-stone-900 block">Cabin 4 Morning Inspection</b>
                <p className="text-xs text-stone-600">Clean cabin awards and morning devotional time.</p>
                <span className="text-[11px] font-bold text-stone-400 block pt-1">July 13, 2027 • 8:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PACKING CHECKLIST */}
      {activeTab === "packing" && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-display font-black text-2xl text-stone-900">Camp Hope Packing Checklist</h2>
              <p className="text-xs sm:text-sm text-stone-600">Check off items as you pack Jamie&apos;s duffel bag. Progress saves automatically.</p>
            </div>
            <span className="font-mono text-sm font-black text-forest-900 bg-forest-100 px-4 py-1.5 rounded-full border border-forest-200">
              {packingPercent}% Packed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packingList.map(item => (
              <div
                key={item.id}
                onClick={() => togglePacking(item.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  item.checked ? "bg-emerald-50/60 border-emerald-300 text-stone-900" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${item.checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-400 bg-white"}`}>
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${item.checked ? "line-through opacity-80" : ""}`}>{item.item}</span>
                    <span className="text-[10px] font-bold uppercase text-stone-500">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CANTEEN */}
      {activeTab === "canteen" && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2 border-b border-stone-100 pb-4">
            <span className="font-mono text-xs font-bold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              CASHLESS CAMP STORE
            </span>
            <h2 className="font-display font-black text-3xl text-stone-900">Camp Canteen Wallet</h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Campers use their digital wristband to buy ice cream, snacks, and camp merch without carrying cash.
            </p>
          </div>

          <div className="bg-forest-950 text-white rounded-2xl p-6 sm:p-8 text-center space-y-2">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-widest block">CURRENT AVAILABLE BALANCE</span>
            <span className="font-display font-black text-4xl sm:text-5xl text-emerald-400 block">${canteenBalance.toFixed(2)}</span>
            <span className="text-xs text-stone-400 block">Daily spending limit: $6.00 / day (snacks & drinks)</span>
          </div>

          {canteenSuccess && (
            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-xs sm:text-sm text-center">
              {canteenSuccess}
            </div>
          )}

          <div className="space-y-3">
            <b className="text-xs sm:text-sm font-bold text-stone-800 block text-center">Quick 1-Tap Reload</b>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={reloadingWallet}
                onClick={() => handleReloadCanteen(10)}
                className="py-4 rounded-xl border-2 border-stone-300 hover:border-forest-800 font-black text-sm text-stone-900 hover:bg-stone-50 transition-all cursor-pointer"
              >
                +$10.00
              </button>
              <button
                type="button"
                disabled={reloadingWallet}
                onClick={() => handleReloadCanteen(25)}
                className="py-4 rounded-xl border-2 border-forest-800 bg-forest-50 font-black text-sm text-forest-950 shadow-xs hover:bg-forest-100 transition-all cursor-pointer"
              >
                +$25.00
              </button>
              <button
                type="button"
                disabled={reloadingWallet}
                onClick={() => handleReloadCanteen(50)}
                className="py-4 rounded-xl border-2 border-stone-300 hover:border-forest-800 font-black text-sm text-stone-900 hover:bg-stone-50 transition-all cursor-pointer"
              >
                +$50.00
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
