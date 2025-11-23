// frontend/components/MenuItemCard.tsx
"use client";

interface MenuItemCardProps {
  itemId: string;
  name: string;
  messages: number;
  priceCents: number;
  companionId: string;
}

export default function MenuItemCard({
  itemId,
  name,
  messages,
  priceCents,
  companionId,
}: MenuItemCardProps) {
  const price = (priceCents / 100).toFixed(2);

  const handleTestPurchase = () => {
    if (typeof window === "undefined") return;

    const key = `kemonoCafe_messages_${companionId}`;
    const current = Number(window.localStorage.getItem(key) || "0");
    const next = current + messages;
    window.localStorage.setItem(key, String(next));

    alert(
      `${name} served! You gained +${messages} messages. New balance: ${next}. (Test mode — no real payment yet.)`
    );
  };

  return (
    <button
      type="button"
      onClick={handleTestPurchase}
      className="w-full rounded-xl border border-pink-100 bg-pink-50/60 hover:bg-pink-100/80 px-3 py-2 text-left flex flex-col gap-0.5 transition-colors"
    >
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="text-[10px] text-slate-500">
        +{messages} messages · ${price}
      </span>
      <span className="text-[10px] text-pink-700">
        (Test) Add messages instantly
      </span>
    </button>
  );
}
