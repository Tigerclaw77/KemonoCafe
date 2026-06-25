// frontend/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findUserById } from "@/lib/auth";
import { incrementMessages, setNomination } from "@/lib/cafeDb";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const MESSAGE_VALUES: Record<string, number> = {
  drink: 10,
  snack: 20,
  entree: 40,
  dessert: 30,
  full_course: 110,
};

function getNominationExpiry() {
  const now = new Date();
  const expires = new Date(now);
  expires.setHours(3, 0, 0, 0);
  if (now.getHours() >= 3) expires.setDate(expires.getDate() + 1);
  return expires;
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

  const rawUserId = session.metadata?.userId;
  const companionId = session.metadata?.companionId ?? null;
  const purchaseType = session.metadata?.type;
  const hasNomination =
    purchaseType === "nomination" || session.metadata?.nomination === "true";

  if (!rawUserId) return NextResponse.json({ received: true });

  const user = await findUserById(rawUserId);

  if (!user) {
    console.error("No matching users row for userId:", rawUserId);
    return NextResponse.json({ received: true });
  }

  if (hasNomination && companionId) {
    await setNomination({
      userId: user.id,
      companionId,
      expiresAt: getNominationExpiry(),
    });
  }

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

  if (messagesToAdd > 0) {
    await incrementMessages(user.id, messagesToAdd);
  }

  return NextResponse.json({ received: true });
}
