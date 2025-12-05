// frontend/components/CompanionProfileModal.tsx
"use client";

import Image from "next/image";
import type { CompanionConfig } from "../config/companions";

interface Props {
  companion: CompanionConfig;
  onClose: () => void;
}

export default function CompanionProfileModal({ companion, onClose }: Props) {
  // Split profileBio into paragraphs on blank lines
  const paragraphs: string[] = companion.profileBio
    .split(/\n\s*\n/) // two or more newlines
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose} // click on backdrop closes modal
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md max-h-[70vh] rounded-2xl bg-slate-900/95 text-slate-50 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <h2 className="text-sm font-semibold">
              {companion.name}
              <span className="text-sky-300"> – {companion.title}</span>
            </h2>
            <p className="text-[11px] text-slate-400">Cast profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-slate-300 hover:text-sky-300"
          >
            ✕ Close
          </button>
        </header>

        {/* Body */}
        <div className="px-4 pt-4 pb-5 flex-1 flex flex-col gap-3">
          {/* Avatar + short header text */}
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-sky-300/80 flex-shrink-0">
              <Image
                src={companion.avatarSrc}
                alt={companion.name}
                fill
                className="object-cover object-[50%_25%]"
              />
            </div>
            <div className="text-xs text-slate-300">
              <p>
                Tonight&apos;s hostess:{" "}
                <span className="text-sky-200 font-medium">
                  {companion.name}
                </span>
              </p>
              <p className="mt-1">
                She&apos;s known for being{" "}
                <span className="text-sky-300">{companion.title}</span> and
                keeping guests comfortable at her table.
              </p>
            </div>
          </div>

          {/* Personality notes */}
          <div className="mt-2">
            <p className="text-[11px] text-slate-400 mb-1">Personality notes</p>
            <div className="text-[13px] leading-relaxed text-slate-100 max-h-40 overflow-y-auto rounded-xl bg-slate-800/60 px-3 py-2 space-y-2">
              {paragraphs.map((para: string, idx: number) => (
                <p key={idx} className="whitespace-normal">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
