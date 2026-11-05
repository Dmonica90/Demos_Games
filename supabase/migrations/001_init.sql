-- Simulador de comunicación escrita: tablas, permisos y tiempo real.
-- Pégalo completo en Supabase → SQL Editor → New query → Run.

create table if not exists public.sessions (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  case_id text not null check (case_id in ('entrega', 'urgente', 'mejorar')),
  status text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  started_at timestamptz,
  duration_s int not null default 480 check (duration_s between 60 and 3600),
  created_at timestamptz not null default now()
);

-- The host key lives apart so no browser can read it back.
create table if not exists public.session_keys (
  code text primary key references public.sessions (code) on delete cascade,
  host_key text not null
);

create table if not exists public.players (
  id uuid primary key,
  session_code text not null references public.sessions (code) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  joined_at timestamptz not null default now(),
  convo jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists players_session_code_idx on public.players (session_code);

alter table public.sessions enable row level security;
alter table public.session_keys enable row level security;
alter table public.players enable row level security;

-- Anyone with the code can see the session and its players (the dashboard and
-- the phones need it). session_keys has no policy at all: nobody reads it.
drop policy if exists "read sessions" on public.sessions;
create policy "read sessions" on public.sessions for select using (true);

drop policy if exists "read players" on public.players;
create policy "read players" on public.players for select using (true);

-- Phones may add and update players only while their session is open.
drop policy if exists "join open session" on public.players;
create policy "join open session" on public.players for insert
  with check (exists (select 1 from public.sessions s where s.code = session_code and s.status <> 'finished'));

drop policy if exists "update in open session" on public.players;
create policy "update in open session" on public.players for update
  using (true)
  with check (exists (select 1 from public.sessions s where s.code = session_code));

-- Sessions are created and changed only through these functions.
create or replace function public.create_session(p_code text, p_case text, p_duration int, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into sessions (code, case_id, duration_s) values (p_code, p_case, p_duration);
  insert into session_keys (code, host_key) values (p_code, p_key);
end $$;

create or replace function public.set_session_status(p_code text, p_key text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from session_keys k where k.code = p_code and k.host_key = p_key) then
    raise exception 'No autorizado';
  end if;
  update sessions
     set status = p_status,
         started_at = case when p_status = 'running' then now() else started_at end
   where code = p_code;
end $$;

revoke all on function public.create_session(text, text, int, text) from public;
revoke all on function public.set_session_status(text, text, text) from public;
grant execute on function public.create_session(text, text, int, text) to anon, authenticated;
grant execute on function public.set_session_status(text, text, text) to anon, authenticated;

-- Realtime: the dashboard and the phones listen to these two tables.
do $$
begin
  begin
    alter publication supabase_realtime add table public.sessions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.players;
  exception when duplicate_object then null;
  end;
end $$;
