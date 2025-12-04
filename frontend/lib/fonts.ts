// frontend/lib/fonts.ts
import { Geist, Geist_Mono, Parisienne } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
});
