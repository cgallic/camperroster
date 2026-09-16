"use client";

import Link from "next/link";
import { Mail, Printer } from "lucide-react";

export default function AdminBunkNotesPage() {
  const notes = [
    {
      id: "n-1",
      camper: "Jamie Gallic",
      cabin: "Cabin 4 • Timber Lodge",
      counselor: "Counselor Mark & Sarah",
      sender: "Mom & Dad (Sarah Gallic)",
      message: "Have an amazing time canoeing today Jamie! We are so proud of you and love you so much! Don't forget sunscreen!"
    },
    {
      id: "n-2",
      camper: "Emma Gallic",
      cabin: "Cabin 4 • Timber Lodge",
      counselor: "Counselor Mark & Sarah",
      sender: "Grandma Rose",
      message: "Sending you huge hugs from Ohio! Hope you catch a big fish in the lake today!"
    },
    {
      id: "n-3",
      camper: "Noah Smith",
      cabin: "Cabin 2 • Lakeview",
      counselor: "Counselor Dave",
      sender: "Mom (Jessica Smith)",
      message: "Good luck in the camp color war today Noah! We are cheering for the Green team!"
    }
  ];

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">
            DAILY 11:00 AM MAIL CALL
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
            Print Daily Bunk Notes ({notes.length} Letters)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 rounded-full bg-forest-900 hover:bg-forest-950 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Batch for Cabins</span>
          </button>
          <Link href="/admin" className="px-4 py-3 rounded-full bg-stone-100 text-stone-800 font-bold text-xs">
            ← Admin
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {notes.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-stone-300 shadow-sm space-y-4 break-inside-avoid">
            <div className="flex items-center justify-between border-b-2 border-stone-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-800 uppercase block">{n.cabin}</span>
                <b className="text-xl font-black text-stone-950">{n.camper}</b>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 font-bold block">From: {n.sender}</span>
                <span className="text-xs text-stone-400 block">July 13, 2027 • 11:00 AM Mail Call</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-base font-serif italic leading-relaxed">
              &quot;{n.message}&quot;
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
              <span>Camp Hope Summer 2027 Daily Bunk Mail</span>
              <span>Delivered by {n.counselor}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
