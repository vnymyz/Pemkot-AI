-- WARNING: this permanently deletes every Pemkot-AI table, row, and function.
-- Run it only on the pemkot-ai Supabase project, and only to start over.
--
-- It does not delete Auth accounts or storage buckets. After a reset, run 01 to 04
-- again and recreate the rows in profiles (see README). To remove stored files,
-- empty the buckets from the Supabase Storage page.

drop function if exists daftar_penugasan(uuid, text, text, int);
drop function if exists detail_proyek(uuid, uuid);
drop function if exists daftar_proyek(uuid, text, text, text, date, date, boolean, int);
drop function if exists simpan_draft_vendor(uuid, uuid, jsonb);
drop function if exists ringkasan_dashboard(uuid);
drop function if exists ajukan_aktivasi_vendor(uuid, uuid);
drop function if exists kirim_verifikasi_vendor(uuid, uuid);
drop function if exists putuskan_dokumen_vendor(uuid, uuid, boolean, text);
drop function if exists ajukan_penugasan(uuid, uuid, uuid, int, date, date, numeric);
drop function if exists ajukan_perubahan_vendor(uuid, uuid, jsonb);
drop function if exists ajukan_arsip_vendor(uuid, uuid);
drop function if exists detail_vendor(uuid);
drop function if exists cari_vendor(text, text, text, text, text, int);
drop function if exists apply_approval(uuid, uuid, boolean, text);
drop function if exists cek_ketersediaan_vendor(uuid, uuid, date, date, int);
drop function if exists rekomendasi_vendor_proyek(uuid, uuid);
drop function if exists cari_vendor_ready(uuid);
drop function if exists hitung_vendor_proyek(uuid);

drop table if exists
  chat_sessions, audit_logs, generated_files,
  vendor_ratings, project_assignments, approvals,
  project_requirements, projects,
  vendor_documents, vendor_unavailability, vendor_certifications, vendor_services,
  profiles, vendors, service_categories, opd
  cascade;

drop function if exists owns_draft_vendor(uuid);
drop function if exists can_read_project(uuid);
drop function if exists is_internal();
drop function if exists current_vendor_id();
drop function if exists current_opd_id();
drop function if exists current_role_name();
