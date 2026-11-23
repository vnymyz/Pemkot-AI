const RANKING_TOPIC = /\b(rekomendasi\w*|ready|skor|peringkat|ranking|gugur|paling atas|teratas|(tidak|nggak|gak|ga) masuk)\b/i;
const WHY_VENDOR = /\b(kenapa|mengapa|alasan)\b.*\b(vendor|pt|cv)\b/i;
const VENDOR_READY = /\bvendor\b.*\bsiap\b/i;
const PERIOD = /\b(bulan|tanggal|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i;
const PROJECT_CONTEXT = /\bproyek\b|PRJ-DEMO-\d+/i;

/** Removes source lines, including those in chats saved before this rule existed. */
export function cleanAssistantText(text: string) {
  return text
    .replace(/^[ \t]*\*{0,2}Sumber\s*:.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * True when the answer depends on the database ranking of a known project.
 * The chat route then forces the ranking tool, so the model cannot answer from memory.
 */
export function needsRanking(question: string, conversation: string) {
  const asks = RANKING_TOPIC.test(question) || WHY_VENDOR.test(question) || VENDOR_READY.test(question);
  if (!asks) return false;
  if (PERIOD.test(question) && !PROJECT_CONTEXT.test(question)) return false;
  return PROJECT_CONTEXT.test(conversation);
}
