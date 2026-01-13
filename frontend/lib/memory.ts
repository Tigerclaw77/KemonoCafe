import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
)

// VERY SIMPLE MVP HEURISTICS
export function extractMemoryCandidate(userMessage: string) {
  const triggers = [
    'i prefer',
    'i usually',
    'i like',
    'i love',
    "i don't like",
    'i hate',
    'i am not into'
  ]

  const normalized = userMessage.toLowerCase()

  if (!triggers.some(t => normalized.includes(t))) return null

  return {
    memory_type: 'preference',
    content: `User ${userMessage.trim()}`,
    importance: 0.8
  }
}

export async function saveMemory({
  userId,
  companionId,
  memory
}: {
  userId: string
  companionId: string
  memory: {
    memory_type: 'fact' | 'preference' | 'boundary'
    content: string
    importance: number
  }
}) {
  await supabase.from('companion_memories').insert({
    user_id: userId,
    companion_id: companionId,
    memory_type: memory.memory_type,
    content: memory.content,
    importance: memory.importance
  })
}

export async function loadMemories({
  userId,
  companionId
}: {
  userId: string
  companionId: string
}) {
  const { data } = await supabase
    .from('companion_memories')
    .select('content')
    .eq('user_id', userId)
    .eq('companion_id', companionId)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  return data?.map(m => m.content) ?? []
}
