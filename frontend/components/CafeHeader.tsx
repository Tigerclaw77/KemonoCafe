// frontend/components/CafeHeader.tsx
"use client";

import Link from "next/link";
import HeaderAuthStatus from "./HeaderAuthStatus";

export default function CafeHeader() {
  return (
    <header className="header-cafe">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="block no-underline">
          <div>
            <h1 className="cafe-logo">Kemono Cafe</h1>
            <p className="cafe-tagline">
              A cozy virtual maid café — pick a hostess and have a seat.
              <span className="neon-heart"> ♥</span>
            </p>
          </div>
        </Link>

        <HeaderAuthStatus />
      </div>
    </header>
  );
}
