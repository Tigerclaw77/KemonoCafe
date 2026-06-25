// frontend/components/HeaderAuthStatus.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserInfo = {
  email: string | null;
};

export default function HeaderAuthStatus() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: { user?: { email?: string | null } | null } =
          await res.json();

        if (!ignore) {
          setUser(data.user ? { email: data.user.email ?? null } : null);
        }
      } catch {
        if (!ignore) setUser(null);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  // While loading, just show the guest UI – it'll flip if we detect a user
  if (!user) {
    return (
      <div className="text-xs text-slate-500 flex items-center gap-3">
        <span className="inline-block rounded-full bg-pink-50 px-3 py-1">
          Guest mode
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
    <div className="flex flex-col items-end gap-1 text-[11px]">
      <span className="auth-pill">
        <span className="auth-dot" />
        <span>
          Logged in as{" "}
          <span className="font-medium">{user.email ?? "guest"}</span>
        </span>
      </span>

      <button type="button" onClick={handleLogout} className="auth-logout">
        Logout
      </button>
    </div>
  );
}
