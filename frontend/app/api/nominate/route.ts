// frontend/app/api/nominate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const nominationPriceId = process.env.STRIPE_PRICE_NOMINATION;

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

export async function POST(req: NextRequest) {
  try {
    // ── ENV sanity checks ─────────────────────────────
    if (!stripeSecretKey) {
      console.error("[nominate] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe not configured (secret key missing)" },
        { status: 500 }
      );
    }

    if (!nominationPriceId) {
      console.error("[nominate] Missing STRIPE_PRICE_NOMINATION");
      return NextResponse.json(
        { error: "Nomination price not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const userId = body.userId as string | undefined;
    const companionId = body.companionId as string | undefined;

    if (!userId || !companionId) {
      console.error("[nominate] Missing userId or companionId", {
        userId,
        companionId,
      });
      return NextResponse.json(
        { error: "Missing userId or companionId" },
        { status: 400 }
      );
    }

    // ── Build URLs directly from request origin ───────
    // This avoids NEXT_PUBLIC_APP_URL and “Not a valid URL” issues
    const baseUrl = req.nextUrl.origin;

    const successUrl = `${baseUrl}/${encodeURIComponent(
  companionId
)}?status=nomination_success`;

const cancelUrl = `${baseUrl}/${encodeURIComponent(
  companionId
)}?status=nomination_cancelled`;


    // quick safety check – throws if invalid
    new URL(successUrl);
    new URL(cancelUrl);

    // ── Create one-time nomination checkout session ───
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // nomination = one-night purchase
      payment_method_types: ["card"],
      line_items: [
        {
          price: nominationPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: "nomination",
        userId,
        companionId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      console.error("[nominate] Session created but no URL", session.id);
      return NextResponse.json(
        { error: "No checkout URL from Stripe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    console.error("[nominate] Error creating nomination session:", err);

    const message =
      err instanceof Error
        ? err.message
        : "Failed to create nomination checkout";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
