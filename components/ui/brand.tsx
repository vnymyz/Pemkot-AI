import { Landmark } from "lucide-react";

/** Neutral placeholder until an official city logo is available (section 12A.8). */
export function Brand({ showSubtitle = true, tone = "dark" }: { showSubtitle?: boolean; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-9 items-center justify-center rounded-md border ${light ? "border-line bg-primary-soft" : "border-surface/30"}`}>
        <Landmark aria-hidden className={`size-5 ${light ? "text-primary" : "text-gold"}`} />
      </span>
      <span className="leading-tight">
        {showSubtitle ? <span className={`block text-caption ${light ? "text-muted" : "text-surface/80"}`}>Pemerintah Kota</span> : null}
        <span className={`block text-card font-semibold ${light ? "text-navy" : "text-surface"}`}>Pemkot-AI</span>
      </span>
    </div>
  );
}
