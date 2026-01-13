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

async function resolveAppUserId(maybeId: string) {
  // 1) If metadata userId is already public.users.id
  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("id", maybeId)
    .maybeSingle();

  if (userRow?.id) return userRow.id;

  // 2) Otherwise treat it as auth_user_id
  const { data: userRow2 } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", maybeId)
    .maybeSingle();

  return userRow2?.id ?? null;
}

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
    console.error("Invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const rawUserId = session.metadata?.userId; // may be auth id OR app users.id
  const companionId = session.metadata?.companionId ?? null;
  const purchaseType = session.metadata?.type;

  console.log("WEBHOOK METADATA:", session.metadata);

  if (!rawUserId) return NextResponse.json({ received: true });

  const appUserId = await resolveAppUserId(rawUserId);

  console.log("rawUserId:", rawUserId);
  console.log("appUserId:", appUserId);

  if (!appUserId) {
    console.error("No matching public.users row for userId:", rawUserId);
    return NextResponse.json({ received: true });
  }

  // ───── Nomination ─────
  if (purchaseType === "nomination") {
    const now = new Date();
    const expires = new Date(now);
    expires.setHours(3, 0, 0, 0);
    if (now.getHours() >= 3) expires.setDate(expires.getDate() + 1);

    const { error } = await supabase.from("nominations").upsert(
      {
        user_id: appUserId,
        companion_id: companionId,
        expires_at: expires.toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) console.error("Nomination upsert error:", error);

    return NextResponse.json({ received: true });
  }

  // ───── Messages ─────
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  let messagesToAdd = 0;

  for (const item of lineItems.data) {
    const desc = item.description?.toLowerCase() || "";
    if (desc.includes("full") && desc.includes("course")) {
      messagesToAdd += MESSAGE_VALUES.full_course;
      continue;
    }
    if (desc.includes("drink")) messagesToAdd += MESSAGE_VALUES.drink;
    if (desc.includes("snack")) messagesToAdd += MESSAGE_VALUES.snack;
    if (desc.includes("entree")) messagesToAdd += MESSAGE_VALUES.entree;
    if (desc.includes("dessert")) messagesToAdd += MESSAGE_VALUES.dessert;
  }

  console.log("messagesToAdd:", messagesToAdd);

  if (messagesToAdd > 0) {
    const { error } = await supabase.rpc("increment_messages", {
      p_user_id: appUserId,
      p_amount: messagesToAdd,
    });

    if (error) console.error("increment_messages RPC error:", error);
  }

  return NextResponse.json({ received: true });
}
