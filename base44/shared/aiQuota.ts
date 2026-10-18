// Per-user daily cap on AI calls, tracked server-side on the user record.
export const AI_DAILY_LIMIT = 150;

// Returns an error Response when the user is over the limit, otherwise records the call and returns null.
export async function checkAiQuota(base44, user) {
  const today = new Date().toISOString().slice(0, 10);
  const used = user.ai_calls_date === today ? (user.ai_calls_count || 0) : 0;
  if (used >= AI_DAILY_LIMIT) {
    return Response.json({ error: `Daily AI limit reached (${AI_DAILY_LIMIT}). Try again tomorrow.` }, { status: 429 });
  }
  await base44.asServiceRole.entities.User.update(user.id, { ai_calls_date: today, ai_calls_count: used + 1 });
  return null;
}