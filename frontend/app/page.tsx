// frontend/app/page.tsx

import Link from "next/link";
import CompanionGrid from "../components/CompanionGrid";
import HeaderAuthStatus from "../components/HeaderAuthStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cafe-gradient text-slate-900 flex flex-col">
      {/* Top header bar */}
      <header className="w-full border-b border-pink-100 bg-white/85 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pink-700">
              Kemono Cafe
            </h1>
            <p className="mt-1 text-[13px] md:text-sm text-slate-600">
              A cozy virtual maid café — pick a hostess and have a seat. ♡
            </p>
          </div>
          <HeaderAuthStatus />
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
            Choose your hostess for today
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-6 max-w-xl">
            Each girl has her own personality and way of talking. You can switch
            anytime, but they’ll remember how you treat them.
          </p>

          <CompanionGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-100 bg-white/85 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] md:text-xs text-slate-500">
            © {new Date().getFullYear()} Kemono Cafe. All rights reserved.
          </p>
          <nav className="flex gap-3 text-[11px] md:text-xs text-slate-500">
            <Link href="/terms" className="hover:text-pink-600">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-pink-600">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-pink-600">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
