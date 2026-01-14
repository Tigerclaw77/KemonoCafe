import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { companionId: string } }
) {
  return NextResponse.json({
    ok: true,
    companionId: params.companionId,
    messages: [],
    hasHistory: false,
  });
}
