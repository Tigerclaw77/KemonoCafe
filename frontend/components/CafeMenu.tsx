// frontend/components/CafeMenu.tsx

"use client";

import { useState } from "react";

type ItemType = "drink" | "snack" | "entree" | "dessert" | "full_course";

interface CafeMenuProps {
  userId: string; // must be a real, logged-in user id
}

const ITEMS: { id: ItemType; label: string; subtitle: string }[] = [
  {
    id: "drink",
    label: "Drink +10 chats",
    subtitle: "Coffee, cola, matcha, etc.",
  },
  {
    id: "snack",
    label: "Snack +20 chats",
    subtitle: "Onigiri, fries, gyoza…",
  },
  {
    id: "entree",
    label: "Entree +40 chats",
    subtitle: "Sandwiches, pasta, katsudon.",
  },
  {
    id: "dessert",
    label: "Dessert +30 chats",
    subtitle: "Cake, parfait, fruit tart.",
  },
  {
    id: "full_course",
    label: "Full Course +100 chats",
    subtitle: "One of each course (best value).",
  },
];

export default function CafeMenu({ userId }: CafeMenuProps) {
  const [loadingItem, setLoadingItem] = useState<ItemType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOrder(itemType: ItemType) {
    if (!userId) {
      setError("Please log in so I can save your order.");
      return;
    }

    setLoadingItem(itemType);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemType }),
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong starting checkout.");
        setLoadingItem(null);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.assign(data.url);
    } catch (err) {
      console.error("Checkout client error:", err);
      setError("The link glitched. Please try again in a moment.");
      setLoadingItem(null);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
      <p className="text-[11px] font-semibold text-slate-700 mb-2">
        Café Menu — extend your time with her ♡
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleOrder(item.id)}
            disabled={loadingItem !== null}
            className="flex flex-col items-start rounded-xl border border-sky-100 bg-white px-3 py-2 text-left text-[11px] shadow-sm hover:border-pink-200 hover:shadow-md disabled:opacity-60"
          >
            <span className="font-semibold text-slate-900">
              {item.label}
            </span>
            <span className="text-[10px] text-slate-500">
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-[10px] text-pink-600">
          {error}
        </p>
      )}
      {loadingItem && (
        <p className="mt-1 text-[10px] text-slate-500">
          Taking you to the register…
        </p>
      )}
    </div>
  );
}
