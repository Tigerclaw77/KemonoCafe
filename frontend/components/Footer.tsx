"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] md:text-xs text-slate-300">
          © {new Date().getFullYear()} Kemono Café. All rights reserved.
        </p>

        <nav className="flex gap-3 text-[11px] md:text-xs text-slate-300">
          <Link href="/terms" className="hover:text-pink-300 transition">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-pink-300 transition">
            Privacy
          </Link>
          <Link href="/faq" className="hover:text-pink-300 transition">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
