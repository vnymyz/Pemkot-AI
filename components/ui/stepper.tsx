import { Check } from "lucide-react";

export type Step = { key: string; label: string; hint?: string };

/**
 * Progress along a fixed path, for example Draft, Verifikasi, Aktif.
 * The current step is marked with text ("Sekarang"), not by color alone.
 */
export function Stepper({ steps, current, label }: { steps: Step[]; current: string; label: string }) {
  const index = steps.findIndex((step) => step.key === current);
  return (
    <ol aria-label={label} className="grid gap-4 sm:grid-flow-col sm:auto-cols-fr">
      {steps.map((step, position) => {
        const done = index > position;
        const active = index === position;
        return (
          <li key={step.key} aria-current={active ? "step" : undefined} className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-caption font-medium ${
                done
                  ? "border-ok bg-ok text-surface"
                  : active
                    ? "border-primary bg-primary text-surface"
                    : "border-line bg-surface text-muted"
              }`}
            >
              {done ? <Check className="size-3.5" /> : position + 1}
            </span>
            <span className="min-w-0">
              <span className={`block text-table font-medium ${active ? "text-navy" : done ? "text-text" : "text-muted"}`}>
                {step.label}
                {active ? <span className="ml-2 text-caption font-normal text-primary">Sekarang</span> : null}
                {done ? <span className="ml-2 text-caption font-normal text-ok">Selesai</span> : null}
              </span>
              {step.hint ? <span className="block text-caption text-muted">{step.hint}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
