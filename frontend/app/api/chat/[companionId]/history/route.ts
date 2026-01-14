import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ companionId: string }> }
) {
  const { companionId } = await context.params;

  return NextResponse.json({
    ok: true,
    companionId,
    messages: [],
    hasHistory: false,
  });
}
