// Single source of truth shared with the owner-authenticated Edge reader.
// The validation stays completely independent of Supabase's Usage/Management API.
export {AI_LEDGER_SOURCE,createAiActionEntry,summarizeAiActionEntries,checkOwnActionCap} from "../supabase/functions/_shared/lizhi-ai-operation-ledger.mjs";
