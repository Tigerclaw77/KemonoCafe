// frontend/components/CafeMenuButton.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { groupMenuByCategory } from "../config/menu";
import MenuItemCard from "./MenuItemCard";
import { parisienne } from "../lib/fonts";

interface CafeMenuButtonProps {
  companionId: string;
  companionName: string; // not used in copy for now
  userId?: string;
}

type MenuCategoryKey = "drink" | "snack" | "entree" | "dessert" | "full_course";

type CartEntry = {
  itemId: string;
  itemType: MenuCategoryKey;
  name: string;
  priceCents: number;
  messages: number;
};

export default function CafeMenuButton({
  companionId,
  // companionName,
  userId,
}: CafeMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ✅ Fix: resolve user id from active Supabase session (don’t trust prop timing)
  const [authChecked, setAuthChecked] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(
    userId
  );

  useEffect(() => {
    let mounted = true;

    async function resolveAuth() {
      if (userId) {
        if (mounted) {
          setResolvedUserId(userId);
          setAuthChecked(true);
        }
        return;
      }

      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!error && data?.user?.id) {
        setResolvedUserId(data.user.id);
      } else {
        setResolvedUserId(undefined);
      }
      setAuthChecked(true);
    }

    resolveAuth();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const menuByCategory = groupMenuByCategory();

  const categoryDescriptions: Record<MenuCategoryKey, string> = {
    drink: "Coffee, tea, and soft drinks to keep your visit lively.",
    snack: "Small bites to share between stories.",
    entree: "Hearty plates for long, unhurried conversations.",
    dessert: "Sweet finishes and late-night treats.",
    full_course:
      "One drink, one snack, one entrée, and one dessert for a complete café experience.",
  };

  const orderedCategories: MenuCategoryKey[] = [
    "drink",
    "snack",
    "entree",
    "dessert",
  ];

  const fullCourseItems = menuByCategory.full_course;
  const fullCourse = fullCourseItems && fullCourseItems[0];

  const cartSummary = useMemo(() => {
    const totalPriceCents = cart.reduce(
      (sum, item) => sum + item.priceCents,
      0
    );
    const totalMessagesBase = cart.reduce(
      (sum, item) => sum + item.messages,
      0
    );

    const hasDrink = cart.some((i) => i.itemType === "drink");
    const hasSnack = cart.some((i) => i.itemType === "snack");
    const hasEntree = cart.some((i) => i.itemType === "entree");
    const hasDessert = cart.some((i) => i.itemType === "dessert");

    const fullCourseEligible = hasDrink && hasSnack && hasEntree && hasDessert;

    // keep this modest so nomination stays appealing
    const fullCourseBonusMessages = fullCourseEligible ? 10 : 0;

    // Discount: price of one drink+snack+entree+dessert minus combo price
    let fullCourseDiscountCents = 0;
    let totalAfterDiscountCents = totalPriceCents;

    if (fullCourseEligible && fullCourse) {
      const drinkPrice =
        cart.find((i) => i.itemType === "drink")?.priceCents ?? 0;
      const snackPrice =
        cart.find((i) => i.itemType === "snack")?.priceCents ?? 0;
      const entreePrice =
        cart.find((i) => i.itemType === "entree")?.priceCents ?? 0;
      const dessertPrice =
        cart.find((i) => i.itemType === "dessert")?.priceCents ?? 0;

      const baseSetPrice = drinkPrice + snackPrice + entreePrice + dessertPrice;

      if (baseSetPrice > fullCourse.priceCents) {
        fullCourseDiscountCents = baseSetPrice - fullCourse.priceCents;
        totalAfterDiscountCents = totalPriceCents - fullCourseDiscountCents;
      }
    }

    return {
      totalPriceCents,
      totalMessagesBase,
      fullCourseEligible,
      fullCourseBonusMessages,
      fullCourseDiscountCents,
      totalAfterDiscountCents,
      totalMessages: totalMessagesBase + fullCourseBonusMessages,
    };
  }, [cart, fullCourse]);

  const handleAddToCart = (item: {
    itemId: string;
    itemType: MenuCategoryKey;
    name: string;
    messages: number;
    priceCents: number;
  }) => {
    if (!authChecked) return;

    if (!resolvedUserId) {
      alert("Please log in so we can save your messages.");
      return;
    }

    setCart((prev) => [...prev, item]);
    setShowCart(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (!authChecked) return;

    if (!resolvedUserId) {
      alert("Please log in so we can save your messages.");
      return;
    }
    if (!cart.length) return;

    setIsCheckingOut(true);
    try {
      // count items per category
      const counts: Partial<Record<MenuCategoryKey, number>> = {};
      for (const item of cart) {
        if (item.itemType === "full_course") continue;
        counts[item.itemType] = (counts[item.itemType] ?? 0) + 1;
      }

      const hasDrink = (counts.drink ?? 0) > 0;
      const hasSnack = (counts.snack ?? 0) > 0;
      const hasEntree = (counts.entree ?? 0) > 0;
      const hasDessert = (counts.dessert ?? 0) > 0;

      const fullCourseEligible =
        hasDrink && hasSnack && hasEntree && hasDessert;

      const items = Object.entries(counts)
        .filter(([, qty]) => (qty ?? 0) > 0)
        .map(([itemType, quantity]) => ({
          itemType,
          quantity,
        }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resolvedUserId,
          companionId,
          items,
          hasFullCourse: fullCourseEligible,
        }),
      });

      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        console.error("Checkout error:", data);
        alert(data.error ?? "Something went wrong starting checkout.");
        return;
      }

      window.location.assign(data.url);
    } catch (err) {
      console.error("Checkout client error:", err);
      alert("The checkout link glitched. Please try again in a moment.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
    inline-flex items-center gap-2
    rounded-full px-3 py-1
    text-[11px] font-medium

    bg-[rgba(20,18,35,0.45)]
    text-[rgba(220,230,255,0.85)]
    border border-[rgba(255,255,255,0.12)]

    hover:bg-[rgba(20,18,35,0.65)]
    transition
  "
      >
        🍰 Café menu
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#f9f4ec] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <header className="relative px-6 py-4 border-b border-slate-200">
              <div className="text-center">
                <h1
                  className={`${parisienne.className} text-[2.4rem] leading-none text-slate-900`}
                >
                  Kemono Cafe Menu
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-6 top-4 text-[11px] text-slate-500 hover:text-slate-700"
              >
                ✕ Close
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-[11px]">
              <div className="max-w-md mx-auto space-y-6 text-center">
                {/* Full Course info */}
                {fullCourse && (
                  <section className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex justify-center items-baseline gap-2">
                      <h2 className="text-[1.9rem] font-[Marcellus] text-slate-900 tracking-wider">
                        Full Course Special
                      </h2>
                      <span className="ml-4 text-base font-[Playfair_Display] text-slate-600 tracking-wide">
                        ${(fullCourse.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-600">
                      {categoryDescriptions.full_course}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      When you include at least one drink, snack, entrée, and
                      dessert, we treat it as a Full Course and can apply a
                      small discount and bonus messages (when purchased
                      together).
                    </p>
                  </section>
                )}

                {/* Sections */}
                {orderedCategories.map((key) => {
                  const items = menuByCategory[key];
                  if (!items || !items.length) return null;

                  const labelMap: Record<MenuCategoryKey, string> = {
                    drink: "Drinks",
                    snack: "Snacks",
                    entree: "Entrees",
                    dessert: "Desserts",
                    full_course: "Full Course",
                  };
                  const label = labelMap[key];

                  const first = items[0];
                  const categoryPrice =
                    typeof first.priceCents === "number"
                      ? (first.priceCents / 100).toFixed(2)
                      : undefined;
                  const categoryMessages =
                    typeof first.messages === "number"
                      ? first.messages
                      : undefined;

                  return (
                    <section
                      key={key}
                      className="pt-2 border-t border-slate-200"
                    >
                      <div className="flex justify-center items-baseline gap-2">
                        <h3 className="font-menu-section text-slate-900">
                          {label}
                        </h3>
                        {categoryPrice && categoryMessages !== undefined && (
                          <>
                            <span className="text-[10px] text-slate-600">
                              ${categoryPrice} each
                            </span>
                            <span className="text-[10px] text-slate-500">
                              · +{categoryMessages} messages
                            </span>
                          </>
                        )}
                      </div>

                      {categoryDescriptions[key] && (
                        <p className="mt-1 mb-2 text-[10px] text-slate-500">
                          {categoryDescriptions[key]}
                        </p>
                      )}

                      <div className="space-y-1.5 text-left">
                        {items.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            itemType={key}
                            itemId={item.id}
                            name={item.name}
                            messages={item.messages}
                            priceCents={item.priceCents}
                            description={item.description}
                            vegan={item.vegan}
                            companionId={companionId}
                            userId={resolvedUserId}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Floating cart button */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCart((v) => !v)}
                className="absolute bottom-4 right-6 inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-[11px] px-3 py-2 shadow-lg"
              >
                🧾 Tab · {cart.length} item{cart.length === 1 ? "" : "s"}
              </button>
            )}

            {/* Cart panel */}
            {cart.length > 0 && showCart && (
              <div className="absolute bottom-14 right-6 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 text-[11px]">
                <h4 className="text-xs font-semibold text-slate-800 mb-2">
                  Your Order
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.itemId}-${idx}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          ${(item.priceCents / 100).toFixed(2)} · +
                          {item.messages} messages
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="text-[10px] text-slate-400 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 border-t border-slate-200 pt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Subtotal</span>
                    <span>
                      ${(cartSummary.totalPriceCents / 100).toFixed(2)} · +
                      {cartSummary.totalMessagesBase} messages
                    </span>
                  </div>

                  {cartSummary.fullCourseDiscountCents > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-700">
                      <span>Full Course discount</span>
                      <span>
                        -$
                        {(cartSummary.fullCourseDiscountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {cartSummary.fullCourseBonusMessages > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-700">
                      <span>Full Course bonus</span>
                      <span>
                        +{cartSummary.fullCourseBonusMessages} messages
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[10px] font-semibold text-slate-900">
                    <span>Estimated total</span>
                    <span>
                      ${(cartSummary.totalAfterDiscountCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-slate-900">
                    <span>Total messages (target)</span>
                    <span>{cartSummary.totalMessages}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="mt-2 w-full inline-flex items-center justify-center rounded-full bg-pink-500 text-white text-[11px] font-semibold py-1.5 hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? "Starting checkout…" : "Proceed to Checkout"}
                </button>
              </div>
            )}

            <footer className="px-6 py-3 border-t border-slate-200 text-[10px] text-slate-500 text-center">
              Stripe opens once when you&apos;re ready to pay your tab.
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
