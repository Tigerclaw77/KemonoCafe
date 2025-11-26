// frontend/components/MenuItemCard.tsx
"use client";

type ItemType = "drink" | "snack" | "entree" | "dessert" | "full_course";

interface MenuItemCardProps {
  itemId: string;
  itemType: ItemType;
  name: string;
  messages: number;
  priceCents: number;
  description?: string;
  vegan?: boolean;
  companionId: string;
  userId: string;
  onAddToCart: (item: {
    itemId: string;
    itemType: ItemType;
    name: string;
    messages: number;
    priceCents: number;
  }) => void;
}

export default function MenuItemCard({
  itemId,
  itemType,
  name,
  messages,
  priceCents,
  description,
  vegan,
  companionId,
  userId,
  onAddToCart,
}: MenuItemCardProps) {
  const handleClick = () => {
    if (!userId) {
      alert("Please log in so we can save your messages.");
      return;
    }

    onAddToCart({
      itemId,
      itemType,
      name,
      messages,
      priceCents,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full py-1.5 px-2 flex items-start text-left text-xs hover:text-slate-900 hover:bg-white/60 rounded-md transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <span className="text-slate-800">{name}</span>
          {vegan && (
            <span
              className="text-[9px] text-emerald-600"
              aria-label="Vegan"
              title="Vegan"
            >
              🌱
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
