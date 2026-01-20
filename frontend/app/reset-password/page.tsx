"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);

    // Optional: redirect after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold">Password updated</h1>
        <p className="mt-2 text-sm text-slate-600">
          You can now log in with your new password.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleReset}
      className="p-6 max-w-md mx-auto space-y-4"
    >
      <h1 className="text-xl font-semibold">Reset your password</h1>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full border rounded px-3 py-2"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
