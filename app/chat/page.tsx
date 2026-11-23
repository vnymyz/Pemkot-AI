import type { Metadata } from "next";
import { ChatApp } from "@/components/chat/ChatApp";
import { getSessionState } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Asisten AI | Pemkot-AI" };

const INTERNAL = [
  "Proyek apa yang belum punya vendor?",
  "Siapa yang ready untuk Renovasi Gedung Dinas?",
  "Kenapa CV Maju Konstruksi tidak masuk rekomendasi Renovasi Gedung Dinas?",
  "Cek PT Karya Bangun",
];
const ADMIN = [...INTERNAL.slice(0, 3), "Saya ingin mendaftarkan vendor baru"];
const VENDOR = [
  "Tampilkan data vendor saya",
  "Proyek apa yang ditugaskan kepada saya?",
  "Apakah vendor saya tersedia bulan Februari?",
  "Saya ingin mendaftarkan usaha saya",
];

export default async function ChatPage() {
  const state = await getSessionState();
  if (state.status !== "ready") return null;
  const { role } = state.session;
  const suggestions = role === "vendor" ? VENDOR : role === "admin_pengadaan" ? ADMIN : INTERNAL;
  return <ChatApp suggestions={suggestions} />;
}
