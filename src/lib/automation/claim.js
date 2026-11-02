import { base44 } from "@/api/base44Client";

// Atomic "first one wins" claim: upsert keyed on claim_key creates the row exactly once.
// Only the caller whose upsert *created* the row may act; everyone else skips.
export async function claimEvent(key, workspace) {
  const res = await base44.entities.AutomationClaim.upsert([{ claim_key: key, workspace }], { key: "claim_key" });
  return res.created === 1;
}

// Release a claim so a failed action can be retried later.
export const releaseEvent = (key) => base44.entities.AutomationClaim.deleteMany({ claim_key: key });