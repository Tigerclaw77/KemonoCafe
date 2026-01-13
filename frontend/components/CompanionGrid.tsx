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
            className="
              group
              flex flex-col
              rounded-2xl
              overflow-hidden

              bg-slate-50/95
              border border-[rgba(180,200,255,0.18)]

              shadow-[0_12px_28px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.25)]
              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:border-cyan-300/60
              hover:shadow-[0_18px_36px_rgba(0,0,0,0.45),0_0_0_1px_rgba(56,189,248,0.6)]
            "
          >
            {/* Image */}
            <div className="relative w-full aspect-4/5 overflow-hidden">
              <Image
                src={`/${girl.file}`}
                alt={girl.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="
                  object-cover
                  object-top
                  transition-transform
                  duration-300
                  group-hover:scale-105
                "
              />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4 gap-1">
              <div className="flex items-center justify-between">
                <h3 className="font-[Playfair_Display] font-semibold text-[1.05rem] text-slate-800">
                  {girl.name}
                </h3>

                <span className="text-[10px] uppercase tracking-widest text-slate-400">
                  {girl.species}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {girl.personality}
              </p>

              {/* CTA pill */}
              <span
                className="
                  mt-auto
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  px-3
                  py-1.5

                  bg-slate-100
                  border border-slate-200
                  text-slate-700
                  text-xs
                  font-semibold

                  transition
                  group-hover:bg-cyan-50
                  group-hover:border-cyan-300
                  group-hover:text-cyan-700
                "
              >
                Chat with {girl.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
