"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthBootstrap() {
  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  return null;
}
