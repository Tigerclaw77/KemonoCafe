// frontend/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { geistSans, geistMono } from "../lib/fonts";

export const metadata: Metadata = {
  title: "Kemono Cafe",
  description: "Kemono Cafe app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
