-- Role helpers and Row Level Security policies. Run after 02_storage.sql.
-- Safe to run again: existing policies in the public schema are replaced.
-- RLS is the second layer. The first layer is the per-role tool list on the server.

revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER avoids policy recursion between tables.
-- Each one answers only about the logged-in user.
-- ---------------------------------------------------------------------------
create or replace function current_role_name() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function current_opd_id() returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select opd_id from profiles where id = auth.uid()
$$;

create or replace function current_vendor_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select vendor_id from profiles where id = auth.uid()
$$;

create or replace function is_internal() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('admin_pengadaan', 'pic_proyek', 'kepala_dinas')
       from profiles where id = auth.uid()),
    false)
$$;

create or replace function can_read_project(p_project_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select case (select role from profiles where id = auth.uid())
    when 'admin_pengadaan' then true
    when 'kepala_dinas' then true
    when 'pic_proyek' then exists (
      select 1 from projects pr
       where pr.id = p_project_id
         and pr.opd_id = (select opd_id from profiles where id = auth.uid()))
    when 'vendor' then exists (
      select 1 from project_assignments a
       where a.project_id = p_project_id
         and a.vendor_id = (select vendor_id from profiles where id = auth.uid())
         and a.status in ('disetujui', 'berjalan', 'selesai'))
    else false
  end
$$;

create or replace function owns_draft_vendor(p_vendor_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from vendors v
     where v.id = p_vendor_id
       and v.status = 'draft'
       and v.id = (select vendor_id from profiles
                    where id = auth.uid() and role = 'vendor'))
$$;

revoke execute on function current_role_name() from public, anon;
revoke execute on function current_opd_id() from public, anon;
revoke execute on function current_vendor_id() from public, anon;
revoke execute on function is_internal() from public, anon;
revoke execute on function can_read_project(uuid) from public, anon;
revoke execute on function owns_draft_vendor(uuid) from public, anon;
grant execute on function current_role_name() to authenticated, service_role;
grant execute on function current_opd_id() to authenticated, service_role;
grant execute on function current_vendor_id() to authenticated, service_role;
grant execute on function is_internal() to authenticated, service_role;
grant execute on function can_read_project(uuid) to authenticated, service_role;
grant execute on function owns_draft_vendor(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Replace all policies
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Reference data: every logged-in user may read. Nobody writes from the browser.
create policy opd_read on opd for select to authenticated using (true);
create policy categories_read on service_categories for select to authenticated using (true);

-- Profiles: read your own row only. There is no write policy, so nobody can change their role.
create policy profiles_own on profiles for select to authenticated
  using (id = (select auth.uid()));

-- Vendors
create policy vendors_read on vendors for select to authenticated
  using ((select is_internal()) or id = (select current_vendor_id()));
create policy vendors_update_draft on vendors for update to authenticated
  using (owns_draft_vendor(id))
  with check (id = (select current_vendor_id()) and status = 'draft');

-- Vendor catalog, certificates, and unavailable periods: the owner edits while in draft.
create policy services_read on vendor_services for select to authenticated
  using ((select is_internal()) or vendor_id = (select current_vendor_id()));
create policy services_write on vendor_services for all to authenticated
  using (owns_draft_vendor(vendor_id)) with check (owns_draft_vendor(vendor_id));

create policy certifications_read on vendor_certifications for select to authenticated
  using ((select is_internal()) or vendor_id = (select current_vendor_id()));
create policy certifications_write on vendor_certifications for all to authenticated
  using (owns_draft_vendor(vendor_id)) with check (owns_draft_vendor(vendor_id));

create policy unavailability_read on vendor_unavailability for select to authenticated
  using ((select is_internal()) or vendor_id = (select current_vendor_id()));
create policy unavailability_write on vendor_unavailability for all to authenticated
  using (owns_draft_vendor(vendor_id)) with check (owns_draft_vendor(vendor_id));

-- Documents: the owner may add or remove, but never set the AI check result.
create policy documents_read on vendor_documents for select to authenticated
  using ((select is_internal()) or vendor_id = (select current_vendor_id()));
create policy documents_insert on vendor_documents for insert to authenticated
  with check (owns_draft_vendor(vendor_id) and status_cek = 'belum' and hasil_cek_ai is null);
create policy documents_delete on vendor_documents for delete to authenticated
  using (owns_draft_vendor(vendor_id));

-- Ratings
create policy ratings_read on vendor_ratings for select to authenticated
  using ((select is_internal()));
create policy ratings_admin on vendor_ratings for all to authenticated
  using ((select current_role_name()) = 'admin_pengadaan')
  with check ((select current_role_name()) = 'admin_pengadaan');

-- Projects and requirements
create policy projects_read on projects for select to authenticated
  using (can_read_project(id));
create policy projects_admin on projects for all to authenticated
  using ((select current_role_name()) = 'admin_pengadaan')
  with check ((select current_role_name()) = 'admin_pengadaan');

create policy requirements_read on project_requirements for select to authenticated
  using (can_read_project(project_id));
create policy requirements_admin on project_requirements for all to authenticated
  using ((select current_role_name()) = 'admin_pengadaan')
  with check ((select current_role_name()) = 'admin_pengadaan');

-- Assignments: read only. Changes go through the server and apply_approval().
create policy assignments_read on project_assignments for select to authenticated
  using (
    case when (select current_role_name()) = 'vendor'
      then vendor_id = (select current_vendor_id())
           and status in ('disetujui', 'berjalan', 'selesai')
      else can_read_project(project_id)
    end
  );

-- Approvals: read only. The server creates proposals, apply_approval() decides them.
create policy approvals_read on approvals for select to authenticated
  using (diusulkan_oleh = (select auth.uid()) or (select current_role_name()) = 'kepala_dinas');

-- System tables
create policy audit_read on audit_logs for select to authenticated
  using ((select current_role_name()) = 'kepala_dinas');

create policy files_read on generated_files for select to authenticated
  using (dibuat_oleh = (select auth.uid()) or (select current_role_name()) = 'kepala_dinas');

create policy chat_own on chat_sessions for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
