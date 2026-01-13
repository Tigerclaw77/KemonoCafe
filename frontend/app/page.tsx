// frontend/app/page.tsx

import Link from "next/link";
import CompanionGrid from "../components/CompanionGrid";
import CafeHeader from "@/components/CafeHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cafe-gradient flex flex-col">
      <CafeHeader />

      {/* Main content */}
      <section className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="cafe-section-title mb-2">
            Choose your hostess for today
          </h1>
          <p className="cafe-section-subtitle mb-6 max-w-xl">
            Each hostess has her own personality and conversation style. You can
            switch anytime.
          </p>

          <CompanionGrid />
        </div>
      </section>
    </main>
  );
}
