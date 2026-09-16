"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, CreditCard, Plus, Trash2 } from "lucide-react";

type LoadedCamper = { id: string; name: string };

export default function CanteenPosPage() {
  const [balance, setBalance] = useState(34.50);
  const [cart, setCart] = useState<{ id: string; name: string; price: number }[]>([]);
  const [camper, setCamper] = useState<LoadedCamper | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "demo">("loading");
  const [posting, setPosting] = useState(false);
  const [receipt, setReceipt] = useState<{ amount: number; live: boolean; error?: string } | null>(null);

  // Attach this register to a real registration IN THE SIGNED-IN USER'S CAMP.
  // This used to query Supabase straight from the browser with the publishable
  // key and no camp filter, so whichever camp owned the first row in the table
  // became "the camper at the register". It now goes through
  // /api/canteen/roster, which resolves the camp from the session.
  // If no camper can be reached the page stays an honest offline demo rather
  // than pretending to debit a ledger.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/canteen/roster?limit=1", { cache: "no-store" });
        const json = await res.json().catch(() => ({ success: false }));

        if (cancelled) return;

        if (!res.ok || !json.success || !json.registrations?.length) {
          setStatus("demo");
          return;
        }

        const row = json.registrations[0];
        setCamper({ id: row.id, name: row.name });
        setBalance((row.balanceCents || 0) / 100);
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("demo");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { id: "item_1", name: "Choco Taco Ice Cream", price: 2.75, category: "Snacks" },
    { id: "item_2", name: "Ice Cold Gatorade", price: 2.25, category: "Drinks" },
    { id: "item_3", name: "Camp Hope Campfire Tee", price: 18.00, category: "Merch" },
    { id: "item_4", name: "LED Trail Flashlight", price: 6.50, category: "Gear" },
    { id: "item_5", name: "Sour Patch Kids", price: 2.00, category: "Snacks" },
    { id: "item_6", name: "Custom Nalgene Bottle", price: 14.00, category: "Gear" },
  ];

  const addToCart = (item: any) => {
    setCart([...cart, item]);
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((acc, curr) => acc + curr.price, 0);

  const handleCheckout = async () => {
    if (balance < total) {
      alert("Insufficient camper balance! Please reload wallet in parent portal.");
      return;
    }

    // Offline demo: no registration attached, so nothing is charged anywhere.
    if (status !== "live" || !camper) {
      setBalance(balance - total);
      setReceipt({ amount: total, live: false });
      setCart([]);
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/portal/canteen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: camper.id,
          amount_cents: -Math.round(total * 100),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setReceipt({ amount: total, live: false, error: json.error || "Request failed" });
        return;
      }

      setBalance((json.new_balance_cents || 0) / 100);
      setReceipt({ amount: total, live: true });
      setCart([]);
    } catch (err: any) {
      setReceipt({ amount: total, live: false, error: err?.message || "Network error" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Director Hub</span>
            </Link>
            <h1 className="font-display font-black text-3xl text-stone-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-forest-800" />
              <span>Camp Hope Cashless Canteen POS</span>
            </h1>
            <p className="text-xs text-stone-600">
              Debit camper store balances with zero cash handling at camp.
            </p>
            {status === "demo" && (
              <p className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl px-3 py-2 max-w-xl leading-relaxed">
                Demo register. No camper wallet is attached, so checking out here changes a number
                on this screen and nothing else &mdash; no balance is charged or saved anywhere.
              </p>
            )}
          </div>

          <div className="double-bezel-outer p-1.5 w-max">
            <div className="double-bezel-inner px-5 py-2 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-400">
                {status === "live" ? "Wallet:" : "Demo wallet:"}
              </span>
              <b className="text-sm font-extrabold text-stone-900">
                {status === "loading" ? "Loading…" : camper ? camper.name : "Sample camper"}
              </b>
              <span className="font-mono font-black text-sm text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-100">
                ${balance.toFixed(2)} Left
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ITEMS CATALOG */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="double-bezel-outer p-1.5 cursor-pointer hover:scale-102 transition-transform"
              >
                <div className="double-bezel-inner p-6 space-y-4 flex flex-col justify-between h-44">
                  <div>
                    <span className="font-mono text-[9px] font-bold uppercase text-stone-400 tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="font-display font-extrabold text-base text-stone-900 mt-1">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="font-mono font-black text-lg text-forest-900">${item.price.toFixed(2)}</span>
                    <button className="w-8 h-8 rounded-full bg-forest-50 text-forest-800 flex items-center justify-center hover:bg-forest-800 hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CART & RECEIPT */}
          <div className="lg:col-span-4 double-bezel-outer p-2">
            <div className="double-bezel-inner p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <b className="font-display font-extrabold text-lg text-stone-900">Current Order</b>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-rose-600 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                  <p>Tap items to add to this camper&apos;s tab</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 text-xs max-h-60 overflow-y-auto">
                  {cart.map((c, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold text-stone-800">{c.name}</span>
                      <span className="font-mono font-bold text-stone-900">${c.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-display font-black text-xl text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Due:</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || posting}
                className="w-full py-3.5 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {posting
                    ? "Charging wallet…"
                    : `Debit Camper Wallet ($${total.toFixed(2)})${status === "live" ? "" : " — demo"}`}
                </span>
              </button>

              {receipt && receipt.live && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-bold">
                  ✓ Charged ${receipt.amount.toFixed(2)}. New wallet balance ${balance.toFixed(2)}, saved to the camper&apos;s record.
                </div>
              )}

              {receipt && !receipt.live && !receipt.error && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 text-center font-bold">
                  Demo sale of ${receipt.amount.toFixed(2)}. Nothing was charged and no balance was saved.
                </div>
              )}

              {receipt && receipt.error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 text-center font-bold">
                  Charge failed — nothing was debited. {receipt.error}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
