// import { NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only, bypasses RLS
// );

// export async function POST(req: Request) {
//   try {
//     const { email, companionId, source } = await req.json();

//     if (!email || typeof email !== "string" || !email.includes("@")) {
//       return NextResponse.json(
//         { error: "Invalid email" },
//         { status: 400 }
//       );
//     }

//     const { error } = await supabase.from("email_captures").insert({
//       email: email.trim().toLowerCase(),
//       companion_id: companionId ?? null,
//       source: source ?? "unknown",
//     });

//     if (error) {
//       // Duplicate email is NOT a hard error for UX
//       if (error.code === "23505") {
//         return NextResponse.json({ success: true });
//       }

//       console.error("Email capture insert error:", error);
//       return NextResponse.json(
//         { error: "Database error" },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("Email capture route error:", err);
//     return NextResponse.json(
//       { error: "Server error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function POST(req: Request) {
  try {
    const { email, companionId, source } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1️⃣ Trigger Supabase verification email
    // ✅ Correct: passwordless email verification
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    // "User already registered" is NOT a failure for us
    if (otpError) {
      console.error("Supabase OTP error:", otpError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // 2️⃣ Store email capture (existing behavior)
    const { error: insertError } = await supabase
      .from("email_captures")
      .insert({
        email: normalizedEmail,
        companion_id: companionId ?? null,
        source: source ?? "unknown",
      });

    // Duplicate email is OK UX-wise
    if (insertError && insertError.code !== "23505") {
      console.error("Email capture insert error:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email capture route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
