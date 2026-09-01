"use client";

import { useState } from "react";
import { Mic, X, Send, CheckCircle2 } from "lucide-react";

export default function KaiCallsSimulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [sentSms, setSentSms] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">KaiCalls 24/7 Voice Assistant</h3>
              <div className="text-xs text-emerald-400 font-mono">Live Call Connected • Session 1 Roster</div>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-12 bg-black/30 rounded-2xl border border-white/5">
          {[8, 24, 40, 16, 32, 10, 28, 44, 18, 30].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-400 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>

        {/* Live Transcript Terminal */}
        <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-stone-300 max-h-48 overflow-y-auto space-y-2 border border-white/5">
          <div className="text-stone-500">[09:14:02] Connected to Camp Hope Line (+1 908-555-0147).</div>
          <div className="text-emerald-400">
            <b>Kai:</b> "Hello! Thanks for calling Camp Hope. How can I help you with our Summer 2027 registration?"
          </div>
          <div className="text-amber-300">
            <b>Parent:</b> "Hi, do you still have spots open for 4th grade boys in Session 1?"
          </div>
          <div className="text-stone-400 text-[11px] bg-white/5 p-1.5 rounded">
            → [MCP Tool] check_session_capacity(grade: 4, gender: &apos;male&apos;) ⇒ 14 spots left
          </div>
          <div className="text-emerald-400">
            <b>Kai:</b> "Yes! We have 14 spots left for Grade 4 boys. Would you like me to text you a 1-tap registration link?"
          </div>
          {sentSms && (
            <div className="text-emerald-300 bg-emerald-950/60 p-2 rounded border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>[SMS Dispatched] → &quot;Hi Peter, tap here to complete Jamie&apos;s registration: https://camperroster.com/register&quot;</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setSentSms(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Dispatch Magic Link SMS
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
