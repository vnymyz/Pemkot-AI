import { Landmark } from "lucide-react";

/** Neutral placeholder until an official city logo is available (section 12A.8). */
export function Brand({ showSubtitle = true }: { showSubtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-md border border-surface/30">
        <Landmark aria-hidden className="size-5 text-gold" />
      </span>
      <span className="leading-tight">
        {showSubtitle ? <span className="block text-caption text-surface/80">Pemerintah Kota</span> : null}
        <span className="block text-card font-semibold text-surface">Pemkot-AI</span>
      </span>
    </div>
  );
}
