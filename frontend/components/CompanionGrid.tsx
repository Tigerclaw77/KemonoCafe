// frontend/components/CompanionGrid.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { CHARACTERS } from "./../config";

export default function CompanionGrid() {
  return (
    <section className="max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CHARACTERS.map((girl) => (
          <Link
            key={girl.id}
            href={`/${girl.id}`}
            className="group flex flex-col rounded-2xl border border-pink-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="relative w-full aspect-[4/5] overflow-hidden">
              <Image
                src={`/${girl.file}`} 
                alt={girl.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Make this a flex column and push the button down with mt-auto */}
            <div className="flex flex-col flex-1 p-4 gap-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{girl.name}</h3>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {girl.species}
                </span>
              </div>

              {/* Line clamp keeps descriptions from making cards unevenly tall */}
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {girl.personality}
              </p>

              {/* mt-auto pins this to the bottom of the card */}
              <span className="mt-auto inline-flex items-center justify-center rounded-full bg-pink-50 text-pink-700 text-xs font-semibold py-1">
                Chat with {girl.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
