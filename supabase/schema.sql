-- ============================================================
-- UniMatch: University Matching System
-- Supabase PostgreSQL Schema (v2)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── Custom ENUM Types ───────────────────────────────────────
create type match_mode         as enum ('department', 'individual');
create type match_status       as enum ('open', 'matched', 'cancelled');
create type participant_status as enum ('pending', 'confirmed', 'waitlisted');
create type contest_app_status as enum ('waiting', 'matched');
create type study_status       as enum ('recruiting', 'active', 'expired');
create type study_app_status   as enum ('pending', 'accepted', 'rejected');
create type notif_type         as enum ('matched', 'applied', 'accepted', 'rejected', 'reminder', 'cancelled');
create type notif_ref_type     as enum ('sport', 'contest', 'study');
create type location_type      as enum ('online', 'offline');

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists public.users (
  id             uuid        references auth.users on delete cascade primary key,
  email          text        not null,
  name           text        not null default '',
  department     text        not null default '',
  student_number text,
  interest_tags  text[]      not null default '{}',
  created_at     timestamptz not null default now()
);

create table if not exists public.sport_matches (
  id           uuid         default uuid_generate_v4() primary key,
  creator_id   uuid         references public.users(id) on delete cascade not null,
  title        text         not null default '',
  match_mode   match_mode   not null default 'department',
  sport_type   text         not null,
  dept_host    text,
  dept_guest   text,
  scheduled_at timestamptz  not null,
  location     text         not null,
  min_players  int          not null default 5,
  max_players  int          not null default 10,
  deadline     timestamptz  not null,
  status       match_status not null default 'open',
  description  text,
  created_at   timestamptz  not null default now()
);

create table if not exists public.sport_participants (
  id        uuid               default uuid_generate_v4() primary key,
  match_id  uuid               references public.sport_matches(id) on delete cascade not null,
  user_id   uuid               references public.users(id) on delete cascade not null,
  team_side text               not null default 'individual',
  intro     text,
  status    participant_status not null default 'pending',
  joined_at timestamptz        not null default now(),
  unique(match_id, user_id)
);

-- contests: used for user-created team recruitment posts
create table if not exists public.contests (
  id             uuid        default uuid_generate_v4() primary key,
  creator_id     uuid        references public.users(id) on delete cascade,
  title          text        not null,
  organizer      text        not null default '',
  category       text        not null,
  description    text,
  deadline       date        not null,
  team_min       int         not null default 2,
  team_max       int         not null default 5,
  required_roles text[]      not null default '{}',
  prize          text,
  external_url   text,
  status         text        not null default 'recruiting',
  created_at     timestamptz not null default now()
);

create table if not exists public.contest_applications (
  id          uuid               default uuid_generate_v4() primary key,
  contest_id  uuid               references public.contests(id) on delete cascade not null,
  user_id     uuid               references public.users(id) on delete cascade not null,
  role_tag    text               not null,
  team_id     uuid,
  status      contest_app_status not null default 'waiting',
  message     text,
  applied_at  timestamptz        not null default now(),
  unique(contest_id, user_id)
);

create table if not exists public.studies (
  id               uuid          default uuid_generate_v4() primary key,
  creator_id       uuid          references public.users(id) on delete cascade not null,
  title            text          not null,
  category_tags    text[]        not null default '{}',
  description      text          not null,
  schedule         text          not null,
  location_type    location_type not null default 'offline',
  location         text,
  min_members      int           not null default 2,
  max_members      int           not null default 6,
  recruit_deadline date          not null,
  status           study_status  not null default 'recruiting',
  created_at       timestamptz   not null default now()
);

create table if not exists public.study_applications (
  id         uuid             default uuid_generate_v4() primary key,
  study_id   uuid             references public.studies(id) on delete cascade not null,
  user_id    uuid             references public.users(id) on delete cascade not null,
  message    text,
  status     study_app_status not null default 'pending',
  applied_at timestamptz      not null default now(),
  unique(study_id, user_id)
);

create table if not exists public.notifications (
  id         uuid           default uuid_generate_v4() primary key,
  user_id    uuid           references public.users(id) on delete cascade not null,
  type       notif_type     not null,
  ref_type   notif_ref_type not null,
  ref_id     uuid           not null,
  message    text           not null,
  is_read    boolean        not null default false,
  created_at timestamptz    not null default now()
);

-- ─── Enable Realtime ─────────────────────────────────────────
alter publication supabase_realtime add table public.sport_participants;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.study_applications;

-- ─── Row Level Security ──────────────────────────────────────
alter table public.users                enable row level security;
alter table public.sport_matches        enable row level security;
alter table public.sport_participants   enable row level security;
alter table public.contests             enable row level security;
alter table public.contest_applications enable row level security;
alter table public.studies              enable row level security;
alter table public.study_applications   enable row level security;
alter table public.notifications        enable row level security;

-- users
create policy "users_select_all"   on public.users for select using (true);
create policy "users_insert_own"   on public.users for insert with check (auth.uid() = id);
create policy "users_update_own"   on public.users for update using (auth.uid() = id);

-- sport_matches
create policy "sport_matches_select_all"     on public.sport_matches for select using (true);
create policy "sport_matches_insert_auth"    on public.sport_matches for insert with check (auth.uid() = creator_id);
create policy "sport_matches_update_creator" on public.sport_matches for update using (auth.uid() = creator_id);
create policy "sport_matches_delete_creator" on public.sport_matches for delete using (auth.uid() = creator_id);
create policy "sport_matches_update_system"  on public.sport_matches for update using (true);

-- sport_participants
create policy "sport_participants_select_all"    on public.sport_participants for select using (true);
create policy "sport_participants_insert_auth"   on public.sport_participants for insert with check (auth.uid() = user_id);
create policy "sport_participants_delete_own"    on public.sport_participants for delete using (auth.uid() = user_id);
create policy "sport_participants_update_system" on public.sport_participants for update using (true);

-- contests
create policy "contests_select_all"      on public.contests for select using (true);
create policy "contests_insert_auth"     on public.contests for insert with check (auth.uid() = creator_id);
create policy "contests_update_creator"  on public.contests for update using (auth.uid() = creator_id or true);
create policy "contests_delete_creator"  on public.contests for delete using (auth.uid() = creator_id);

-- contest_applications
create policy "contest_apps_select_relevant" on public.contest_applications for select
  using (auth.uid() = user_id or
         auth.uid() = (select creator_id from public.contests where id = contest_id));
create policy "contest_apps_insert_auth"     on public.contest_applications for insert with check (auth.uid() = user_id);
create policy "contest_apps_update_system"   on public.contest_applications for update using (true);

-- studies
create policy "studies_select_all"     on public.studies for select using (true);
create policy "studies_insert_auth"    on public.studies for insert with check (auth.uid() = creator_id);
create policy "studies_update_creator" on public.studies for update using (auth.uid() = creator_id);
create policy "studies_delete_creator" on public.studies for delete using (auth.uid() = creator_id);

-- study_applications
create policy "study_apps_select_relevant" on public.study_applications for select
  using (auth.uid() = user_id or
         auth.uid() = (select creator_id from public.studies where id = study_id));
create policy "study_apps_insert_auth"     on public.study_applications for insert with check (auth.uid() = user_id);
create policy "study_apps_update_relevant" on public.study_applications for update
  using (auth.uid() = user_id or
         auth.uid() = (select creator_id from public.studies where id = study_id));
create policy "study_apps_delete_own"      on public.study_applications for delete using (auth.uid() = user_id);

-- notifications
create policy "notif_select_own"    on public.notifications for select using (auth.uid() = user_id);
create policy "notif_insert_system" on public.notifications for insert with check (true);
create policy "notif_update_own"    on public.notifications for update using (auth.uid() = user_id);

-- ─── Functions & Triggers ────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, department, student_number)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'department', ''),
    new.raw_user_meta_data->>'student_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-match sport: when min_players reached, status -> matched (removed from listing)
create or replace function public.check_sport_match()
returns trigger as $$
declare
  v_match       public.sport_matches%rowtype;
  v_host_count  int;
  v_guest_count int;
  v_total_count int;
begin
  select * into v_match from public.sport_matches where id = new.match_id;
  if v_match.status != 'open' then return new; end if;

  if v_match.match_mode = 'department' then
    select count(*) into v_host_count  from public.sport_participants where match_id = new.match_id and team_side = 'host';
    select count(*) into v_guest_count from public.sport_participants where match_id = new.match_id and team_side = 'guest';
    if v_host_count >= v_match.min_players and v_guest_count >= v_match.min_players then
      update public.sport_participants set status = 'confirmed' where match_id = new.match_id and status = 'pending';
      update public.sport_matches set status = 'matched' where id = new.match_id;
      insert into public.notifications (user_id, type, ref_type, ref_id, message)
        select sp.user_id, 'matched', 'sport', new.match_id, v_match.sport_type || ' 경기 매칭이 성사되었습니다!'
        from public.sport_participants sp where sp.match_id = new.match_id and sp.status = 'confirmed';
    end if;
  else
    select count(*) into v_total_count from public.sport_participants where match_id = new.match_id;
    if v_total_count >= v_match.min_players then
      update public.sport_participants set status = 'confirmed'
        where match_id = new.match_id and status = 'pending'
          and id in (select id from public.sport_participants where match_id = new.match_id order by joined_at limit v_match.max_players);
      update public.sport_matches set status = 'matched' where id = new.match_id;
      insert into public.notifications (user_id, type, ref_type, ref_id, message)
        select sp.user_id, 'matched', 'sport', new.match_id, v_match.sport_type || ' 경기 매칭이 성사되었습니다!'
        from public.sport_participants sp where sp.match_id = new.match_id and sp.status = 'confirmed';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_sport_participant_added
  after insert on public.sport_participants
  for each row execute procedure public.check_sport_match();

-- Auto-match contest: when team_min applications reached, status -> matched (removed from listing)
create or replace function public.check_contest_match()
returns trigger as $$
declare
  v_contest public.contests%rowtype;
  v_count   int;
  v_team_id uuid;
begin
  select * into v_contest from public.contests where id = new.contest_id;
  if v_contest.status != 'recruiting' then return new; end if;

  select count(*) into v_count from public.contest_applications where contest_id = new.contest_id and status = 'waiting';

  if v_count >= v_contest.team_min then
    v_team_id := uuid_generate_v4();
    update public.contest_applications
      set status = 'matched', team_id = v_team_id
      where contest_id = new.contest_id and status = 'waiting'
        and id in (select id from public.contest_applications
                   where contest_id = new.contest_id and status = 'waiting'
                   order by applied_at limit v_contest.team_max);
    update public.contests set status = 'matched' where id = new.contest_id;
    insert into public.notifications (user_id, type, ref_type, ref_id, message)
      select ca.user_id, 'matched', 'contest', new.contest_id,
             '"' || v_contest.title || '" 팀원 모집이 완료되었습니다! 🎉'
      from public.contest_applications ca where ca.contest_id = new.contest_id and ca.status = 'matched';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_contest_application_added
  after insert on public.contest_applications
  for each row execute procedure public.check_contest_match();