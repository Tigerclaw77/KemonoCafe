"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userContext, setUserContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          userContext,
        }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cafe-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur-sm border border-pink-100 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-1 text-center">
          {isLogin ? "Welcome back to Kemono Cafe" : "Create your cafe account"}
        </h1>

        <p className="text-xs text-slate-500 mb-4 text-center">
          {isLogin
            ? "Log in to keep your companions, message limits, and nominations in sync."
            : "Register to save your companions and unlock nominations across devices."}
        </p>

        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-3 py-1 text-xs rounded-l-full border border-pink-200 ${
              isLogin ? "bg-pink-500 text-white" : "bg-white text-pink-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`px-3 py-1 text-xs rounded-r-full border border-pink-200 border-l-0 ${
              !isLogin ? "bg-pink-500 text-white" : "bg-white text-pink-600"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300"
            />
          )}

          {!isLogin && (
            <textarea
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              rows={2}
              placeholder="Anything else we should know? (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          )}

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300"
          />

          <div>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              {isLogin
                ? "Use the password for your Kemono Cafe account."
                : "Use at least 8 characters."}
            </p>
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pink-500 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
              ? "Log in"
              : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}
