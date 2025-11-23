// frontend/components/CafeMenuButton.tsx
"use client";

import { useState } from "react";
import { groupMenuByCategory } from "../config/menu";
import MenuItemCard from "./MenuItemCard";

interface CafeMenuButtonProps {
  companionId: string;
  companionName: string;
}

export default function CafeMenuButton({
  companionId,
  companionName,
}: CafeMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const menuByCategory = groupMenuByCategory();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-600 transition-colors"
      >
        🍰 Order from the café
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-4 py-3 border-b border-pink-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Café Menu
                </h2>
                <p className="text-[11px] text-slate-500">
                  Order something for {companionName} to add more messages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-pink-600 hover:text-pink-700"
              >
                ✕ Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-[11px]">
              {(
                [
                  ["drink", "Drinks"],
                  ["snack", "Snacks"],
                  ["entree", "Entrees"],
                  ["dessert", "Desserts"],
                  ["full_course", "Full Course"],
                ] as const
              ).map(([key, label]) => {
                const items = menuByCategory[key];
                if (!items.length) return null;
                return (
                  <div key={key}>
                    <h3 className="font-semibold text-pink-700 mb-1">{label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          itemId={item.id}
                          name={item.name}
                          messages={item.messages}
                          priceCents={item.priceCents}
                          companionId={companionId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="px-4 py-2 border-t border-pink-100 text-[10px] text-slate-400">
              Test mode only — purchases immediately add messages locally. In
              production this will be connected to Stripe.
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
