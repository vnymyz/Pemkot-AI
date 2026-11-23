"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";
import { putuskan, type PersetujuanState } from "./actions";

const initial: PersetujuanState = { error: null, success: null };

export function PersetujuanForm({ approvalId }: { approvalId: string }) {
  const [state, action, pending] = useActionState(putuskan, initial);
  const [decision, setDecision] = useState<"setuju" | "tolak" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const approveRef = useRef<HTMLButtonElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  function confirmDecision() {
    const selected = decision;
    setDecision(null);
    const submitter = selected === "setuju" ? approveRef.current : rejectRef.current;
    if (submitter) formRef.current?.requestSubmit(submitter);
  }

  return (
    <>
    <form ref={formRef} action={action} className="mt-3 border-t border-line pt-3">
      <input type="hidden" name="approval_id" value={approvalId} />
      <label className="block">
        <span className="text-caption font-medium text-muted">Catatan keputusan</span>
        <textarea
          name="catatan"
          maxLength={1000}
          rows={2}
          className="mt-1 w-full panel rounded-md border border-line bg-surface px-3 py-2 text-table"
        />
      </label>
      {state.error ? <p role="alert" className="mt-2 text-table text-bad">{state.error}</p> : null}
      {state.success ? <p role="status" className="mt-2 text-table text-ok">{state.success}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          ref={approveRef}
          type="submit"
          name="keputusan"
          value="setuju"
          disabled={pending || !!state.success}
          onClick={(event) => {
            event.preventDefault();
            setDecision("setuju");
          }}
          className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-table font-medium text-surface hover:bg-navy disabled:cursor-not-allowed"
        >
          Setujui
        </button>
        <button
          ref={rejectRef}
          type="submit"
          name="keputusan"
          value="tolak"
          disabled={pending || !!state.success}
          onClick={(event) => {
            event.preventDefault();
            setDecision("tolak");
          }}
          className="inline-flex h-11 items-center rounded-md border border-bad px-4 text-table font-medium text-bad hover:bg-surface disabled:cursor-not-allowed"
        >
          Tolak
        </button>
      </div>
    </form>
    <ConfirmationDialog
      open={decision !== null}
      title={decision === "setuju" ? "Setujui usulan?" : "Tolak usulan?"}
      description={
        decision === "setuju"
          ? "Kapasitas vendor akan diperiksa ulang sebelum persetujuan diterapkan. Pastikan keputusan dan catatan sudah benar."
          : "Pastikan keputusan dan catatan sudah benar. Usulan akan ditolak."
      }
      confirmLabel={decision === "setuju" ? "Setujui usulan" : "Tolak usulan"}
      danger={decision === "tolak"}
      pending={pending}
      onCancel={() => setDecision(null)}
      onConfirm={confirmDecision}
    />
    </>
  );
}
