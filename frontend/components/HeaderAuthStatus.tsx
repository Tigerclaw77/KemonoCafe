// frontend/components/HeaderAuthStatus.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type UserInfo = {
  email: string | null;
};

export default function HeaderAuthStatus() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("supabase.auth.getUser error:", error);
        }
        if (!ignore) {
          setUser(
            data.user ? { email: data.user.email ?? null } : null
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user ? { email: session.user.email ?? null } : null
      );
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear user state
  };

  // While loading, just show the guest UI – it'll flip if we detect a user
  if (!user) {
    return (
      <div className="text-xs text-slate-500 flex items-center gap-3">
        <span className="inline-block rounded-full bg-pink-50 px-3 py-1">
          Guest mode · 6 free messages
        </span>
        <Link
          href="/auth"
          className="text-[11px] text-pink-600 hover:text-pink-700 underline underline-offset-2"
        >
          Login / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>
          Logged in as{" "}
          <span className="font-medium">
            {user.email ?? "guest"}
          </span>
        </span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-[11px] text-pink-600 hover:text-pink-700 underline underline-offset-2"
      >
        Logout
      </button>
    </div>
  );
}
