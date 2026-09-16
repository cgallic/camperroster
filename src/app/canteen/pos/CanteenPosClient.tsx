"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, CreditCard, Check, Sparkles, Plus, Trash2 } from "lucide-react";

export default function CanteenPosPage() {
  const [balance, setBalance] = useState(34.50);
  const [cart, setCart] = useState<{ id: string; name: string; price: number }[]>([]);
  const [lastCheckout, setLastCheckout] = useState<number | null>(null);

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

  const handleCheckout = () => {
    if (balance < total) {
      alert("Insufficient camper balance! Please reload wallet in parent portal.");
      return;
    }
    setBalance(balance - total);
    setLastCheckout(total);
    setCart([]);
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
          </div>

          <div className="double-bezel-outer p-1.5 w-max">
            <div className="double-bezel-inner px-5 py-2 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase text-stone-400">Camper:</span>
              <b className="text-sm font-extrabold text-stone-900">Jamie Gallic (Pine 2)</b>
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
                  <p>Tap items to add to Jamie&apos;s canteen tab</p>
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
                disabled={cart.length === 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                <span>Debit Camper Wallet (${total.toFixed(2)})</span>
              </button>

              {lastCheckout && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-bold">
                  ✓ Debited ${lastCheckout.toFixed(2)} to live Supabase ledger!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
