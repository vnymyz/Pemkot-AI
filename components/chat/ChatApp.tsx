"use client";

import type { UIMessage } from "ai";
import { History, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ChatWindow } from "./ChatWindow";

type ChatMeta = { id: string; judul: string | null; updated_at: string };
type Current = { id: string; messages: UIMessage[] };

const WIDTH_KEY = "pemkot_chat_panel_width";
const OPEN_KEY = "pemkot_chat_panel_open";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 440;
const KEY_STEP = 16;

const clampWidth = (value: number) => Math.min(Math.max(Math.round(value), MIN_WIDTH), MAX_WIDTH);

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The layout choice simply is not remembered.
  }
}

export function ChatApp({ suggestions }: { suggestions: string[] }) {
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [current, setCurrent] = useState<Current>(() => ({ id: crypto.randomUUID(), messages: [] }));
  const [loadingList, setLoadingList] = useState(true);
  const [opening, setOpening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); // phone and tablet
  const [panelOpen, setPanelOpen] = useState(true); // desktop
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatMeta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) setChats(await response.json());
    } catch {
      // The history list is optional.
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    try {
      const width = Number(localStorage.getItem(WIDTH_KEY));
      if (width) setPanelWidth(clampWidth(width));
      setPanelOpen(localStorage.getItem(OPEN_KEY) !== "0");
    } catch {
      // Defaults are used when storage is unavailable.
    }
  }, []);

  function togglePanel() {
    const next = !panelOpen;
    setPanelOpen(next);
    remember(OPEN_KEY, next ? "1" : "0");
  }

  function setAndSaveWidth(value: number) {
    const width = clampWidth(value);
    setPanelWidth(width);
    remember(WIDTH_KEY, String(width));
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }

  function moveResize(event: PointerEvent<HTMLDivElement>) {
    if (!resizing || !panelRef.current) return;
    setPanelWidth(clampWidth(event.clientX - panelRef.current.getBoundingClientRect().left));
  }

  function endResize() {
    if (!resizing) return;
    setResizing(false);
    remember(WIDTH_KEY, String(panelWidth));
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const next: Record<string, number> = {
      ArrowLeft: panelWidth - KEY_STEP,
      ArrowRight: panelWidth + KEY_STEP,
      Home: MIN_WIDTH,
      End: MAX_WIDTH,
    };
    if (next[event.key] === undefined) return;
    event.preventDefault();
    setAndSaveWidth(next[event.key]);
  }

  function newChat() {
    setCurrent({ id: crypto.randomUUID(), messages: [] });
    setHistoryOpen(false);
  }

  async function openChat(id: string) {
    setHistoryOpen(false);
    setOpening(true);
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) throw new Error();
      const { messages } = (await response.json()) as { messages: UIMessage[] };
      setCurrent({ id, messages: messages ?? [] });
    } catch {
      newChat();
    } finally {
      setOpening(false);
    }
  }

  async function confirmDeleteChat() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete request failed");
      setChats((list) => list.filter((chat) => chat.id !== id));
      if (current.id === id) newChat();
      setDeleteTarget(null);
    } catch {
      setDeleteError("Percakapan belum terhapus. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  }

  const panelLabel = panelOpen ? "Tutup riwayat" : "Buka riwayat";

  return (
    <div className={`flex min-h-0 flex-1 flex-col lg:flex-row ${resizing ? "cursor-col-resize select-none" : ""}`}>
      <aside
        ref={panelRef}
        style={{ "--chat-panel": `${panelWidth}px` } as CSSProperties}
        className={`no-print relative flex shrink-0 flex-col border-b border-line bg-surface lg:border-r lg:border-b-0 ${
          panelOpen ? "lg:w-[var(--chat-panel)]" : "lg:w-[68px]"
        }`}
      >
        <div className={`flex gap-2 p-3 ${panelOpen ? "" : "lg:flex-col"}`}>
          <button
            type="button"
            onClick={newChat}
            title={panelOpen ? undefined : "Percakapan baru"}
            className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-table font-medium text-surface hover:bg-navy ${
              panelOpen ? "" : "lg:w-11 lg:flex-none lg:px-0"
            }`}
          >
            <MessageSquarePlus aria-hidden className="size-4 shrink-0" />
            <span className={`truncate ${panelOpen ? "" : "lg:sr-only"}`}>Percakapan baru</span>
          </button>
          <button
            type="button"
            aria-expanded={historyOpen}
            aria-controls="chat-history"
            onClick={() => setHistoryOpen((value) => !value)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-table font-medium text-primary lg:hidden"
          >
            <History aria-hidden className="size-4" />
            Riwayat
          </button>
          <button
            type="button"
            onClick={togglePanel}
            aria-expanded={panelOpen}
            aria-controls="chat-history"
            aria-label={panelLabel}
            title={panelLabel}
            className="hidden size-11 shrink-0 items-center justify-center rounded-md border border-line text-primary hover:bg-primary-soft lg:inline-flex"
          >
            {panelOpen ? <PanelLeftClose aria-hidden className="size-4" /> : <PanelLeftOpen aria-hidden className="size-4" />}
          </button>
        </div>

        <nav
          id="chat-history"
          aria-label="Riwayat percakapan"
          className={`${historyOpen ? "block" : "hidden"} max-h-56 overflow-y-auto px-2 pb-3 lg:max-h-none lg:flex-1 ${
            panelOpen ? "lg:block" : "lg:hidden"
          }`}
        >
          <p className="px-2 pb-1 text-caption font-medium text-muted">Riwayat</p>
          {loadingList ? (
            <p className="flex items-center gap-2 px-2 py-2 text-caption text-muted">
              <Spinner className="size-4" />
              Memuat riwayat
            </p>
          ) : null}
          {!loadingList && chats.length === 0 ? (
            <p className="px-2 py-2 text-caption text-muted">Belum ada percakapan.</p>
          ) : null}
          <ul className="space-y-0.5">
            {chats.map((chat) => (
              <li key={chat.id} className={`flex items-center rounded-md ${current.id === chat.id ? "bg-primary-soft" : ""}`}>
                <button
                  type="button"
                  aria-current={current.id === chat.id ? "true" : undefined}
                  onClick={() => openChat(chat.id)}
                  title={chat.judul ?? "Percakapan"}
                  className="min-h-11 min-w-0 flex-1 truncate rounded-md px-2 text-left text-table hover:text-primary"
                >
                  {chat.judul || "Percakapan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(chat);
                  }}
                  disabled={deletingId === chat.id}
                  aria-label={`Hapus percakapan ${chat.judul ?? ""}`}
                  title="Hapus percakapan"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:text-bad disabled:cursor-not-allowed"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {panelOpen ? (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Ubah lebar panel riwayat"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={panelWidth}
            title="Geser untuk mengubah lebar. Klik dua kali untuk ukuran awal."
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onDoubleClick={() => setAndSaveWidth(DEFAULT_WIDTH)}
            onKeyDown={resizeWithKeyboard}
            className="group absolute inset-y-0 -right-1.5 z-20 hidden w-3 cursor-col-resize touch-none justify-center lg:flex"
          >
            <span className={`h-full w-0.5 transition-colors group-hover:bg-primary group-focus-visible:bg-primary ${resizing ? "bg-primary" : "bg-transparent"}`} />
          </div>
        ) : null}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {opening ? (
          <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 text-primary">
            <Spinner className="size-8" />
            <p className="text-table text-muted">Memuat percakapan</p>
          </div>
        ) : (
          <ChatWindow
            key={current.id}
            chatId={current.id}
            initialMessages={current.messages}
            suggestions={suggestions}
            onSaved={refresh}
          />
        )}
      </div>
      <ConfirmationDialog
        open={deleteTarget !== null}
        title="Hapus percakapan?"
        description={`Percakapan "${deleteTarget?.judul || "Percakapan"}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus percakapan"
        danger
        pending={deletingId !== null}
        error={deleteError}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDeleteChat()}
      />
    </div>
  );
}
