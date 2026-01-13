import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const REWARD_MESSAGES = 6;

export default async function AuthCallbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const authUser = data.user;

  if (!authUser) redirect("/");

  // 1️⃣ Ensure user exists in app users table
  const syncRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/sync-user`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authUserId: authUser.id,
        email: authUser.email,
      }),
      cache: "no-store",
    }
  );

  if (!syncRes.ok) {
    console.error("User sync failed");
    redirect("/chat");
  }

  // 2️⃣ Load user row (FOR GUARD)
  const { data: userRow } = await supabase
    .from("users")
    .select("id, email_verified_rewarded_at")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!userRow) {
    console.error("User row missing after sync");
    redirect("/chat");
  }

  // 3️⃣ If already rewarded → do nothing
  if (userRow.email_verified_rewarded_at) {
    redirect("/chat?verified=1");
  }

  const now = new Date().toISOString();

  // 4️⃣ Grant reward atomically
  // 4a) Mark reward as used
  await supabase
    .from("users")
    .update({ email_verified_rewarded_at: now })
    .eq("id", userRow.id);

  // 4b) Grant messages (safe upsert)
  await supabase
    .from("message_balances")
    .upsert(
      {
        user_id: userRow.id,
        remaining_messages: REWARD_MESSAGES,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  redirect("/chat?verified=1");
}
