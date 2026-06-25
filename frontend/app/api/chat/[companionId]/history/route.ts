import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getChatHistory } from "@/lib/cafeDb";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ companionId: string }> }
) {
  const user = await getCurrentUser();
  const { companionId } = await context.params;

  if (!user) {
    return NextResponse.json({
      ok: true,
      companionId,
      messages: [],
      hasHistory: false,
    });
  }

  const history = await getChatHistory(user.id, companionId, 50);
  const messages = history.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));

  return NextResponse.json({
    ok: true,
    companionId,
    messages,
    hasHistory: messages.length > 0,
  });
}
