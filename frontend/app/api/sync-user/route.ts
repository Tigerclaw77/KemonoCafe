// frontend/app/api/sync-user/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary stub for /api/sync-user
 *
 * This exists so Next.js sees this file as a valid module.
 * You can expand this later to actually sync Supabase user data.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      status: "ok",
      message: "sync-user endpoint is not implemented yet.",
    },
    { status: 200 }
  );
}

// Optional: allow GET as well (handy for quick testing)
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: "ok",
      message: "sync-user endpoint is not implemented yet.",
    },
    { status: 200 }
  );
}
