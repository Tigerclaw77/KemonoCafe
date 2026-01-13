// frontend/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ───────────────────────────────────────────────
// Stripe init
// ───────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// ───────────────────────────────────────────────
// Supabase admin client (server-only)
// ───────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ───────────────────────────────────────────────
// Price → message mapping (Option 1)
// ───────────────────────────────────────────────
const PRICE_TO_MESSAGES: Record<string, number> = {
  [process.env.STRIPE_PRICE_DRINK!]: 10,
  [process.env.STRIPE_PRICE_SNACK!]: 20,
  [process.env.STRIPE_PRICE_ENTREE!]: 40,
  [process.env.STRIPE_PRICE_DESSERT!]: 30,
  [process.env.STRIPE_PRICE_FULL_COURSE!]: 110,
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Only handle completed checkouts
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // ✅ Correct source of truth
  const userId = session.metadata?.userId;
  const companionId = session.metadata?.companionId ?? null;

  if (!userId) {
    console.error("❌ Missing metadata.userId on checkout session", {
      sessionId: session.id,
    });
    return NextResponse.json({ received: true });
  }

  // ───────────────────────────────────────────────
  // Step 1 – Fetch line items to get price IDs
  // ───────────────────────────────────────────────
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  });

  let messagesToAdd = 0;
  let nominationPurchased = false;

  for (const item of lineItems.data) {
    const priceId = item.price?.id;

    if (!priceId) continue;

    // Nomination is its own price
    if (priceId === process.env.STRIPE_PRICE_NOMINATION) {
      nominationPurchased = true;
      continue;
    }

    // Message packs
    if (PRICE_TO_MESSAGES[priceId]) {
      messagesToAdd += PRICE_TO_MESSAGES[priceId];
    }
  }

  // ───────────────────────────────────────────────
  // Step 2 – Apply message credits (bankable)
  // ───────────────────────────────────────────────
  if (messagesToAdd > 0) {
    const { error } = await supabase.rpc("increment_messages", {
      user_id: userId,
      amount: messagesToAdd,
    });

    if (error) {
      console.error("❌ Failed to increment messages:", error);
    } else {
      console.log(
        `✅ Added ${messagesToAdd} messages for user ${userId}`
      );
    }
  }

  // ───────────────────────────────────────────────
  // Step 3 – Nomination: unlimited until next 3 AM
  // ───────────────────────────────────────────────
  if (nominationPurchased) {
    const now = new Date();
    const expires = new Date(now);

    expires.setHours(3, 0, 0, 0);
    if (now.getHours() >= 3) {
      expires.setDate(expires.getDate() + 1);
    }

    const { error } = await supabase
      .from("nominations")
      .upsert(
        {
          user_id: userId,
          companion_id: companionId,
          expires_at: expires.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("❌ Failed nomination upsert:", error);
    } else {
      console.log(
        `✅ Nomination granted for user ${userId} until ${expires.toISOString()}`
      );
    }
  }

  return NextResponse.json({ received: true });
}
