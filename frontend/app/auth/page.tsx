// frontend/app/auth/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthApiError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // for magic-link status

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Email + password login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push("/");
      } else {
        // Registration
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        // Create matching profile row (best-effort)
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              display_name: displayName || null,
            });

          if (profileError) {
            console.warn("Profile insert failed:", profileError);
          }
        }

        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);

      if (err instanceof AuthApiError) {
        // Supabase auth-specific errors
        if (isLogin && err.status === 400) {
          // “Invalid login credentials”
          setError("Incorrect email or password. Please try again.");
        } else if (err.status === 429) {
          setError(
            "Too many attempts in a short time. Please wait a moment and try again."
          );
        } else {
          setError(err.message || "Could not sign you in. Please try again.");
        }
      } else if (err instanceof Error) {
        setError(err.message || "Something went wrong.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Magic-link login (login mode only)
  const handleMagicLink = async () => {
    setError(null);
    setInfo(null);

    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    setLoading(true);
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        },
      });

      if (magicError) {
        throw magicError;
      }

      setInfo("Magic login link sent. Please check your email.");
    } catch (err: unknown) {
      console.error("Magic-link error:", err);

      if (err instanceof AuthApiError) {
        if (err.status === 400) {
          setError(
            "We couldn’t send a magic link to that address. Please check for typos and try again."
          );
        } else if (err.status === 429) {
          setError(
            "Too many magic link requests. Please wait a moment and try again."
          );
        } else {
          setError(err.message || "Could not send magic link.");
        }
      } else if (err instanceof Error) {
        setError(err.message || "Could not send magic link.");
      } else {
        setError("Could not send magic link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cafe-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/90 backdrop-blur-sm border border-pink-100 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-1 text-center">
          {isLogin ? "Welcome back to Kemono Cafe" : "Create your café account"}
        </h1>
        <p className="text-xs text-slate-500 mb-4 text-center">
          {isLogin
            ? "Log in to keep your companions, message limits, and nominations in sync."
            : "Register to save your companions and unlock nominations across devices."}
        </p>

        {/* Mode toggle */}
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Display name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                placeholder="What should the girls call you?"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required={!isLogin} // for magic-link users we technically don't need it, but keep simple for now
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-500 mt-1">{error}</p>
          )}

          {info && (
            <p className="text-[11px] text-emerald-600 mt-1">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
          >
            {loading
              ? isLogin
                ? "Logging in…"
                : "Creating account…"
              : isLogin
              ? "Log in with password"
              : "Register"}
          </button>
        </form>

        {/* Magic link button – login mode only */}
        {isLogin && (
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full mt-3 inline-flex items-center justify-center rounded-full border border-pink-300 bg-white px-4 py-2 text-xs font-semibold text-pink-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
          >
            {loading ? "Sending link…" : "Send me a magic login link"}
          </button>
        )}

        <p className="text-[11px] text-slate-400 mt-4 text-center">
          You can still browse and chat in guest mode, but accounts keep your
          companions and nominations saved.
        </p>
      </div>
    </main>
  );
}
