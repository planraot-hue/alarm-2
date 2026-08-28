-- ============================================================
--  My Planner — Supabase schema
--  รันไฟล์นี้ใน Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ---------- ตารางนัดหมาย ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  category    text not null default 'other',
  start_date  date not null,
  end_date    date not null,
  all_day     boolean not null default false,
  start_time  time,
  end_time    time,
  location    text,
  note        text,
  reminders   smallint[] not null default '{4320,1440,60}',
  created_at  timestamptz not null default now()
);

create index if not exists events_user_start_idx
  on public.events (user_id, start_date);

-- ---------- ตารางไฟล์แนบ (metadata; ตัวไฟล์อยู่ใน Storage) ----------
create table if not exists public.attachments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  mime_type   text not null default '',
  size_bytes  bigint not null default 0,
  storage_path text not null,
  created_at  timestamptz not null default now()
);

create index if not exists attachments_event_idx
  on public.attachments (event_id);

-- ============================================================
--  สิทธิ์ระดับตาราง (GRANT)
--
--  จำเป็นต้องมี แยกจาก RLS คนละชั้นกัน:
--    GRANT = role นี้แตะตารางนี้ได้ไหม   -> ไม่มีจะได้ permission denied for table
--    RLS   = แตะได้แล้วเห็น/แก้แถวไหนบ้าง -> ไม่ผ่านจะได้ violates row-level security policy
--  ปกติ Supabase ตั้ง default privileges ไว้ให้ แต่ไม่ได้ผลทุกโปรเจกต์
--  จึงสั่งตรง ๆ ไว้เลยเพื่อความแน่นอน
--
--  ให้เฉพาะ authenticated เท่านั้น — anon (ยังไม่ล็อกอิน) ไม่ต้องแตะตารางนี้
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.events      to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;

-- ============================================================
--  Row Level Security — แต่ละคนเห็นเฉพาะข้อมูลของตัวเอง
-- ============================================================

alter table public.events      enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "events_select_own" on public.events;
drop policy if exists "events_insert_own" on public.events;
drop policy if exists "events_update_own" on public.events;
drop policy if exists "events_delete_own" on public.events;

create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

drop policy if exists "attachments_select_own" on public.attachments;
drop policy if exists "attachments_insert_own" on public.attachments;
drop policy if exists "attachments_delete_own" on public.attachments;

create policy "attachments_select_own" on public.attachments
  for select using (auth.uid() = user_id);
create policy "attachments_insert_own" on public.attachments
  for insert with check (auth.uid() = user_id);
create policy "attachments_delete_own" on public.attachments
  for delete using (auth.uid() = user_id);

-- ============================================================
--  Mood Tracker — บันทึกอารมณ์วันละ 1 ครั้ง
--  primary key (user_id, day) บังคับ 1 อารมณ์ต่อวันในตัวเอง
--  จึงใช้ upsert ทับได้เลยเวลาผู้ใช้เปลี่ยนใจ
-- ============================================================

create table if not exists public.moods (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  emoji      text not null,
  note       text,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ============================================================
--  Habit Tracker — นิสัยที่อยากทำซ้ำ ๆ + บันทึกว่าวันไหนทำแล้ว
--  habit_logs: มีแถว = วันนั้นทำแล้ว, ไม่มีแถว = ยังไม่ทำ
-- ============================================================

create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  icon       text not null default '⭐',
  color      text not null default 'pink',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits (user_id, sort_order);

create table if not exists public.habit_logs (
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  primary key (habit_id, day)
);

create index if not exists habit_logs_user_day_idx on public.habit_logs (user_id, day);

-- ============================================================
--  Sticky Notes — โน้ตสั้น ๆ แปะกระดาน
-- ============================================================

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  color      text not null default 'lemon',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id, sort_order);

-- ---------- GRANT + RLS ของสามฟีเจอร์ใหม่ ----------

grant select, insert, update, delete on public.moods      to authenticated;
grant select, insert, update, delete on public.habits     to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.notes      to authenticated;

alter table public.moods      enable row level security;
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;
alter table public.notes      enable row level security;

-- เขียนตรง ๆ ทีละ policy แทนการวนลูปด้วย dynamic SQL
-- ยาวกว่าแต่ตรงไปตรงมา อ่านออก และไม่มีอะไรให้พลาดตอนรัน

drop policy if exists "moods_select_own" on public.moods;
drop policy if exists "moods_insert_own" on public.moods;
drop policy if exists "moods_update_own" on public.moods;
drop policy if exists "moods_delete_own" on public.moods;

create policy "moods_select_own" on public.moods
  for select using (auth.uid() = user_id);
create policy "moods_insert_own" on public.moods
  for insert with check (auth.uid() = user_id);
create policy "moods_update_own" on public.moods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "moods_delete_own" on public.moods
  for delete using (auth.uid() = user_id);

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

drop policy if exists "habit_logs_select_own" on public.habit_logs;
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
drop policy if exists "habit_logs_update_own" on public.habit_logs;
drop policy if exists "habit_logs_delete_own" on public.habit_logs;

create policy "habit_logs_select_own" on public.habit_logs
  for select using (auth.uid() = user_id);
create policy "habit_logs_insert_own" on public.habit_logs
  for insert with check (auth.uid() = user_id);
create policy "habit_logs_update_own" on public.habit_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_delete_own" on public.habit_logs
  for delete using (auth.uid() = user_id);

drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- ============================================================
--  Storage bucket สำหรับไฟล์แนบ (private)
--  ไฟล์เก็บที่ path:  {user_id}/{attachment_id}
--
--  ห่อด้วย DO block ดักข้อผิดพลาดไว้ เพราะบางโปรเจกต์ไม่ให้สิทธิ์แก้
--  storage.objects จาก SQL Editor  ถ้าไม่ห่อไว้ ทั้งสคริปต์จะ rollback
--  ทำให้ตารางด้านบนหายไปด้วยทั้งที่สร้างสำเร็จแล้ว
-- ============================================================

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', false)
  on conflict (id) do nothing;
exception when insufficient_privilege or undefined_table then
  raise notice 'ข้ามการสร้าง bucket — ให้สร้าง bucket ชื่อ attachments (private) เองที่หน้า Storage';
end $$;

do $$
begin
  drop policy if exists "attachments_storage_select_own" on storage.objects;
  drop policy if exists "attachments_storage_insert_own" on storage.objects;
  drop policy if exists "attachments_storage_delete_own" on storage.objects;

  create policy "attachments_storage_select_own" on storage.objects
    for select using (
      bucket_id = 'attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  create policy "attachments_storage_insert_own" on storage.objects
    for insert with check (
      bucket_id = 'attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  create policy "attachments_storage_delete_own" on storage.objects
    for delete using (
      bucket_id = 'attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when insufficient_privilege then
  raise notice 'ข้ามการสร้าง storage policy — ตั้งเองที่ Storage → attachments → Policies โดยใช้เงื่อนไข (storage.foldername(name))[1] = auth.uid()::text';
end $$;

-- ============================================================
--  ตรวจผล — ควรได้ events และ attachments พร้อม rowsecurity = true
-- ============================================================
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('events', 'attachments', 'moods', 'habits', 'habit_logs', 'notes')
order by tablename;
