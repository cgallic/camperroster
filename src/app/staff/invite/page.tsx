import { Suspense } from "react";
import AcceptInvitation from "./AcceptInvitation";

export const metadata = { title: "Accept camp invitation", robots: { index: false, follow: false } };

export default function StaffInvitePage() {
  return <main className="max-w-md mx-auto px-4 py-16"><Suspense fallback={<div className="rounded-3xl bg-white border-2 border-stone-200 h-56 animate-pulse" />}><AcceptInvitation /></Suspense></main>;
}
