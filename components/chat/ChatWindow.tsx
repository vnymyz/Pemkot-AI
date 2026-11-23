"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CircleX, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { OFFLINE_MESSAGE } from "@/lib/ai/persona";
import { Composer } from "./Composer";
import { AssistantRow, MessageBubble, ToolPending } from "./MessageBubble";

function titleFrom(messages: UIMessage[]) {
  const first = messages.find((message) => message.role === "user");
  const part = first?.parts.find((item) => item.type === "text");
  const text = part?.type === "text" ? part.text.trim() : "";
  return text ? text.slice(0, 60) : null;
}

export function ChatWindow({
  chatId,
  initialMessages,
  suggestions,
  onSaved,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  suggestions: string[];
  onSaved: () => void;
}) {
  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat<UIMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: async ({ messages: all, isError }) => {
      if (isError) return;
      try {
        const response = await fetch(`/api/sessions/${chatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ judul: titleFrom(all), messages: all }),
        });
        if (response.ok) onSaved();
      } catch {
        // History is best effort. The conversation on screen is unaffected.
      }
    },
  });

  const [draft, setDraft] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, status, error]);

  function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    if (error) clearError();
    sendMessage({ text: message });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="py-6">
              <h1 className="text-[2rem] leading-10 font-semibold text-navy">Apa yang bisa saya bantu?</h1>
              <p className="mt-2 text-body text-muted">
                Saya menjawab berdasarkan data vendor dan proyek di sistem. Pilih contoh di bawah, atau tulis pertanyaan sendiri.
              </p>
              <div data-tour="chat-saran" className="mt-6 grid gap-3 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => send(item)}
                    className="min-h-14 rounded-lg border border-line bg-surface px-4 py-3 text-left text-table text-text transition-colors hover:border-primary hover:bg-primary-soft"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-caption text-muted">
                Saya hanya membahas vendor, proyek, dan pekerjaan kantor. Usulan yang saya siapkan tetap menunggu persetujuan.
              </p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {status === "submitted" ? (
            <AssistantRow>
              <ToolPending label="Menyiapkan jawaban" />
            </AssistantRow>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-md border border-bad bg-surface p-3 text-table text-bad">
              <p className="flex items-start gap-2">
                <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" />
                {OFFLINE_MESSAGE}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  regenerate();
                }}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 font-medium text-primary hover:bg-primary-soft"
              >
                <RotateCcw aria-hidden className="size-4" />
                Coba lagi
              </button>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <Composer
        value={draft}
        busy={busy}
        onChange={setDraft}
        onSend={() => {
          send(draft);
          setDraft("");
        }}
      />
    </div>
  );
}
