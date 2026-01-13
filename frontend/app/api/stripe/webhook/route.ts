// frontend/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    console.error("❌ Invalid webhook signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  const userId = metadata.userId;
  const companionId = metadata.companionId ?? null;

  if (!userId) {
    console.error("❌ Missing metadata.userId");
    return NextResponse.json({ received: true });
  }

  // ─────────────────────────────
  // 1️⃣ Nomination (flag-based)
  // ─────────────────────────────
  if (metadata.nomination === "true") {
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
      console.error("❌ Nomination upsert failed:", error);
    } else {
      console.log("✅ Nomination granted");
    }
  }

  // ─────────────────────────────
  // 2️⃣ Messages (metadata-driven)
  // ─────────────────────────────
  let messagesToAdd = 0;

  if (metadata.hasFullCourse === "true") {
    messagesToAdd += MESSAGE_VALUES.full_course;
  }

  if (metadata.itemType && MESSAGE_VALUES[metadata.itemType]) {
    messagesToAdd += MESSAGE_VALUES[metadata.itemType];
  }

  if (messagesToAdd > 0) {
    const { error } = await supabase.rpc("increment_messages", {
      user_id: userId,
      amount: messagesToAdd,
    });

    if (error) {
      console.error("❌ Message increment failed:", error);
    } else {
      console.log(`✅ Added ${messagesToAdd} messages`);
    }
  }

  return NextResponse.json({ received: true });
}
