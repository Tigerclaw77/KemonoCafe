"use client";

import { useEffect } from "react";

export default function AuthBootstrap() {
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).catch(() => {});
  }, []);

  return null;
}
