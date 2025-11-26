// frontend/app/api/checkout/route.ts

import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// Stripe client – cast apiVersion to avoid TS complaining
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || "") as string, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

// Base config for each MENU item type (bankable messages)
const ITEM_CONFIG = {
  drink: { priceId: process.env.STRIPE_PRICE_DRINK!, messages: 10 },
  snack: { priceId: process.env.STRIPE_PRICE_SNACK!, messages: 20 },
  entree: { priceId: process.env.STRIPE_PRICE_ENTREE!, messages: 40 },
  dessert: { priceId: process.env.STRIPE_PRICE_DESSERT!, messages: 30 },

  // Full course is a REAL discounted combo Stripe product (e.g. $13.99)
  // It should always be priced so that it's the best value per message.
  full_course: {
    priceId: process.env.STRIPE_PRICE_FULL_COURSE!,
    messages: 110, // base 100 + 10 bonus
  },
};

// Nomination is a separate, premium, NON-bankable item (0 messages)
const NOMINATION_PRICE_ID = process.env.STRIPE_PRICE_NOMINATION!;

type ItemKey = keyof typeof ITEM_CONFIG;

// Multi-item cart body (menu items + optional nomination toggle)
type MultiItemBody = {
  userId: string;
  items: { itemType: string; quantity: number }[];
  hasFullCourse?: boolean;
  addNomination?: boolean; // NEW: add a nomination to this purchase
};

// Legacy/single item body (still supported)
type SingleItemBody = {
  userId: string;
  itemType: ItemKey | "nomination";
};

type CheckoutBody = MultiItemBody | SingleItemBody;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    // Let TS infer the array type from Stripe’s types
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = { userId };

    // ─────────────────────────────────────────
    // Cart-style: multiple items in `items`[]
    // ─────────────────────────────────────────
    if ("items" in body && Array.isArray(body.items)) {
      const counts: Partial<Record<ItemKey, number>> = {};

      // 1) Bankable menu items: drinks/snacks/entrees/desserts
      for (const entry of body.items) {
        const key = entry.itemType as ItemKey;
        const qty = entry.quantity ?? 0;
        if (!ITEM_CONFIG[key] || qty <= 0) continue;
        counts[key] = (counts[key] ?? 0) + qty;
      }

      const drinkQty = counts.drink ?? 0;
      const snackQty = counts.snack ?? 0;
      const entreeQty = counts.entree ?? 0;
      const dessertQty = counts.dessert ?? 0;

      let fullCourseCombos = 0;

      // 2) If they qualified and hasFullCourse is true, treat 1 set as a Full Course combo.
      //    Stripe is charged the discounted FULL_COURSE price,
      //    we will later credit 110 messages per combo in the webhook.
      if (
        body.hasFullCourse &&
        ITEM_CONFIG.full_course.priceId &&
        drinkQty > 0 &&
        snackQty > 0 &&
        entreeQty > 0 &&
        dessertQty > 0
      ) {
        fullCourseCombos = 1; // keep it simple: max 1 set

        // Remove 1 of each from the a-la-carte counts
        counts.drink = drinkQty - 1;
        counts.snack = snackQty - 1;
        counts.entree = entreeQty - 1;
        counts.dessert = dessertQty - 1;

        // Add the Full Course combo as its own Stripe line item
        lineItems.push({
          price: ITEM_CONFIG.full_course.priceId,
          quantity: fullCourseCombos,
        });

        metadata.hasFullCourse = "true";
        metadata.fullCourseCombos = String(fullCourseCombos);
      }

      // 3) Remaining à-la-carte items (still bankable)
      (["drink", "snack", "entree", "dessert"] as ItemKey[]).forEach((key) => {
        const qty = counts[key] ?? 0;
        const cfg = ITEM_CONFIG[key];
        if (!cfg || !cfg.priceId || qty <= 0) return;

        lineItems.push({
          price: cfg.priceId,
          quantity: qty,
        });
      });

      // 4) Optional nomination (premium, non-bankable)
      if (body.addNomination && NOMINATION_PRICE_ID) {
        lineItems.push({
          price: NOMINATION_PRICE_ID,
          quantity: 1,
        });
        metadata.nomination = "true";
      }

      if (!lineItems.length) {
        return NextResponse.json(
          { error: "No valid items in cart" },
          { status: 400 }
        );
      }
    } else {
      // ─────────────────────────────────────
      // Legacy: single itemType in body
      // Supports either a single menu item OR a single nomination.
      // ─────────────────────────────────────
      const single = body as SingleItemBody;
      const key = single.itemType;

      if (key === "nomination") {
        if (!NOMINATION_PRICE_ID) {
          return NextResponse.json(
            { error: "Nomination price not configured" },
            { status: 500 }
          );
        }

        lineItems.push({
          price: NOMINATION_PRICE_ID,
          quantity: 1,
        });
        metadata.nomination = "true";
      } else {
        if (!key || !ITEM_CONFIG[key]) {
          return NextResponse.json(
            { error: "Invalid itemType" },
            { status: 400 }
          );
        }

        const cfg = ITEM_CONFIG[key];

        lineItems.push({
          price: cfg.priceId,
          quantity: 1,
        });

        metadata.itemType = key;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/checkout/cancel`,
      client_reference_id: userId,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
