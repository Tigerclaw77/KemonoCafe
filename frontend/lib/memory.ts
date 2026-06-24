import { dbQuery, dbQueryOne } from "./db";

// VERY SIMPLE MVP HEURISTICS
export function extractMemoryCandidate(userMessage: string) {
  const triggers = [
    "i prefer",
    "i usually",
    "i like",
    "i love",
    "i don't like",
    "i hate",
    "i am not into",
  ];

  const normalized = userMessage.toLowerCase();

  if (!triggers.some((t) => normalized.includes(t))) return null;

  return {
    memory_type: "preference" as const,
    content: `User ${userMessage.trim()}`,
    importance: 0.8,
  };
}

export async function saveMemory({
  userId,
  companionId,
  memory,
}: {
  userId: string;
  companionId: string;
  memory: {
    memory_type: "fact" | "preference" | "boundary";
    content: string;
    importance: number;
  };
}) {
  await dbQueryOne<{ id: string }>(
    `
      insert into companion_memories (
        user_id,
        companion_id,
        memory_type,
        content,
        importance
      )
      values ($1, $2, $3, $4, $5)
      returning id
    `,
    [
      userId,
      companionId,
      memory.memory_type,
      memory.content,
      memory.importance,
    ]
  );
}

export async function loadMemories({
  userId,
  companionId,
}: {
  userId: string;
  companionId: string;
}) {
  const data = await dbQuery<{ content: string }>(
    `
      select content
      from companion_memories
      where user_id = $1
        and companion_id = $2
      order by importance desc, created_at desc
      limit 5
    `,
    [userId, companionId]
  );

  return data.map((m) => m.content);
}
