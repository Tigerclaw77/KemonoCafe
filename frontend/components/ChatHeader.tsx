// frontend/components/ChatHeader.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CompanionProfileModal from "./CompanionProfileModal";
import type { CompanionConfig } from "../config/companions";

interface ChatHeaderProps {
  companion: CompanionConfig;
}

export default function ChatHeader({ companion }: ChatHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="w-full border-b border-sky-100 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Home / brand (clickable) */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-50 text-sm font-semibold hover:text-sky-200"
          >
            <span className="inline-flex h-7 items-center rounded-full bg-slate-800/70 px-3 text-[12px] border border-sky-400/40">
              Kemono Cafe
            </span>
          </Link>

          {/* Current hostess identity – avatar opens profile modal */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={`View profile for ${companion.name}`}
            title={`View profile for ${companion.name}`}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-sky-300 group-hover:ring-sky-200 transition-colors">
              <Image
                src={companion.avatarSrc}
                alt={companion.name}
                fill
                className="object-cover object-[50%_25%]"
              />
            </div>
            <p className="text-xs font-semibold text-slate-50 group-hover:text-sky-100">
              {companion.name}
            </p>
          </button>
        </div>
      </header>

      {profileOpen && (
        <CompanionProfileModal
          companion={companion}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
