// frontend/components/CompanionProfileHero.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { CompanionConfig } from "../config/companions";
import CompanionProfileModal from "./CompanionProfileModal";

interface Props {
  companion: CompanionConfig;
}

export default function CompanionProfileHero({ companion }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center text-center mt-8 mb-6">
        {/* Big clickable portrait */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View profile for ${companion.name}`}
          title={`View profile for ${companion.name}`}
          className="relative w-56 h-56 md:w-72 md:h-72 rounded-4xl overflow-hidden ring-4 ring-sky-300 shadow-2xl 
                     transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-pink-300"
        >
          <Image
            src={companion.avatarSrc}
            alt={companion.name}
            fill
            // bias crop toward upper center → more face
            className="object-cover object-[50%_25%]"
          />
        </button>

        {/* Single line: Name – Species/Title */}
        <p className="mt-4 text-xl font-semibold tracking-tight text-slate-100">
          {companion.name}
          <span className="ml-2 font-medium text-sky-300">
            — {companion.title}
          </span>
        </p>

        <p className="mt-1 text-[11px] text-slate-300/70 transition group-hover:text-slate-200">
          Click her portrait to see her profile.
        </p>
      </div>

      {open && (
        <CompanionProfileModal
          companion={companion}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
