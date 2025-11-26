import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

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

  // Call your own API route to sync into `users` table
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authUserId: authUser.id,
      email: authUser.email,
    }),
    cache: "no-store",
  });

  // Redirect them back to the café (you can store last page in a cookie later)
  redirect("/chat");
}
