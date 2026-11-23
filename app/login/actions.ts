"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { quickLoginAllowed } from "@/lib/auth/quick-login";
import { publicSupabaseEnv } from "@/lib/db/env";
import { userDb } from "@/lib/db/server";

export type LoginState = { error: string | null };

const QUICK_LOGIN_EMAILS = {
  admin_pengadaan: "admin.pengadaan@contoh.test",
  pic_proyek: "pic.proyek@contoh.test",
  kepala_dinas: "kepala.dinas@contoh.test",
  vendor: "vendor.demo@contoh.test",
} as const;

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});
const quickRole = z.enum(["admin_pengadaan", "pic_proyek", "kepala_dinas", "vendor"]);

/** Allows same-site paths only, so a crafted link cannot send the user to another website. */
function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  return value;
}

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!publicSupabaseEnv()) {
    return { error: "Layanan login belum dikonfigurasi. Silakan hubungi pengelola demo." };
  }

  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Periksa kembali format email dan kata sandi." };

  try {
    const supabase = await userDb();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return {
        error:
          error.code === "invalid_credentials"
            ? "Email atau kata sandi tidak sesuai."
            : "Layanan login sedang tidak tersedia. Silakan coba lagi sebentar lagi.",
      };
    }
  } catch {
    return { error: "Layanan login sedang tidak tersedia. Silakan coba lagi sebentar lagi." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function quickSignIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!quickLoginAllowed()) {
    return { error: "Login cepat hanya tersedia saat aplikasi berjalan lokal." };
  }

  const parsedRole = quickRole.safeParse(formData.get("role"));
  const password = process.env.DEMO_QUICK_LOGIN_PASSWORD;
  if (!parsedRole.success || !password) {
    return { error: "Login cepat belum dikonfigurasi untuk akun demo." };
  }
  if (!publicSupabaseEnv()) {
    return { error: "Layanan login belum dikonfigurasi. Silakan hubungi pengelola demo." };
  }

  try {
    const supabase = await userDb();
    const { error } = await supabase.auth.signInWithPassword({
      email: QUICK_LOGIN_EMAILS[parsedRole.data],
      password,
    });
    if (error) {
      return {
        error:
          error.code === "invalid_credentials"
            ? "Akun demo belum dibuat atau kata sandinya tidak cocok."
            : "Layanan login sedang tidak tersedia. Silakan coba lagi sebentar lagi.",
      };
    }
  } catch (error) {
    console.error("[auth] quick login failed:", (error as Error).message);
    return { error: "Layanan login sedang tidak tersedia. Silakan coba lagi sebentar lagi." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  if (publicSupabaseEnv()) {
    const supabase = await userDb();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
