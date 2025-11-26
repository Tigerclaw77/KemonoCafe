// frontend/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Stripe init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin level
);

// Bankable message dictionary
const MESSAGE_VALUES: Record<string, number> = {
  drink: 10,
  snack: 20,
  entree: 40,
  dessert: 30,
  full_course: 110,
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
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
    console.error("⚠️ Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;
  const metadata = session.metadata || {};

  if (!userId) {
    console.error("Missing userId in metadata/session");
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  // ───────────────────────────────────────────────
  // Step 1 – Pull line items
  // ───────────────────────────────────────────────
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  let addMessages = 0;
  let nominationPurchased = false;

  // Check metadata flags & Stripe items
  for (const item of lineItems.data) {
    const description = item.description?.toLowerCase() || "";

    if (description.includes("nomination")) {
      nominationPurchased = true;
      continue;
    }

    // Detect full course
    if (description.includes("full") && description.includes("course")) {
      addMessages += MESSAGE_VALUES.full_course;
      continue;
    }

    // Detect individual menu items
    if (description.includes("drink")) addMessages += MESSAGE_VALUES.drink;
    if (description.includes("snack")) addMessages += MESSAGE_VALUES.snack;
    if (description.includes("entree")) addMessages += MESSAGE_VALUES.entree;
    if (description.includes("dessert")) addMessages += MESSAGE_VALUES.dessert;
  }

  // ───────────────────────────────────────────────
  // Step 2 – Apply MENU messages (bankable)
  // ───────────────────────────────────────────────
  if (addMessages > 0) {
    const { error } = await supabase.rpc("increment_messages", {
      user_id: userId,
      amount: addMessages,
    });

    if (error) {
      console.error("Failed to add messages:", error);
    }
  }

  // ───────────────────────────────────────────────
  // Step 3 – Nomination: unlimited until next 3AM
  // ───────────────────────────────────────────────
  if (nominationPurchased) {
    const now = new Date();
    const expires = new Date(now);

    // Move to next 3AM
    expires.setHours(3, 0, 0, 0);
    if (now.getHours() >= 3) {
      // already past 3am today → use tomorrow
      expires.setDate(expires.getDate() + 1);
    }

    const { error } = await supabase
      .from("nominations")
      .upsert(
        {
          user_id: userId,
          expires_at: expires.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) console.error("Failed nom. upsert:", error);
  }

  return NextResponse.json({ received: true });
}
