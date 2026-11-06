-- Código Clip: sesiones, jugadores, votos, rescates y ventas.
-- Pégalo completo en Supabase → SQL Editor → New query → Run (después de 001).
-- Es seguro correrlo otra vez: solo crea lo que falta y reemplaza las funciones.
--
-- Privacidad: el navegador solo puede leer cc_sessions (sin datos de nadie).
-- Nombres, roles, votos y rescates se leen únicamente con las funciones de
-- abajo: el host con su llave, cada celular con su token y solo lo suyo.
-- cc_close borra a todos los jugadores (y en cascada sus votos, rescates y
-- ventas); no se exporta nada.
--
-- Las reglas son las mismas que app/src/codigo/state.ts.

create table if not exists public.cc_sessions (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  status text not null default 'registro' check (status in ('registro', 'jugando', 'cerrada')),
  total int not null default 0,
  section int not null default 0,
  round_open boolean not null default false,
  vote_round int not null default 0,
  vote_open boolean not null default false,
  points_on boolean not null default true,
  sale_open boolean not null default false,
  rev int not null default 0,
  created_at timestamptz not null default now()
);

-- La llave del host y la baraja de roles: nadie las lee desde el navegador.
create table if not exists public.cc_private (
  code text primary key references public.cc_sessions (code) on delete cascade,
  host_key text not null,
  slots jsonb not null default '[]',
  overflow jsonb not null default '[]'
);

create table if not exists public.cc_players (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.cc_sessions (code) on delete cascade,
  num int not null,
  name text not null check (char_length(name) between 1 and 40),
  name_norm text not null,
  role text not null,
  decoy text check (decoy in ('comercio', 'venta')),
  auditor boolean not null default false,
  points int not null default 0,
  joined_at timestamptz not null default now(),
  unique (session_code, num),
  unique (session_code, name_norm)
);

create table if not exists public.cc_votes (
  session_code text not null references public.cc_sessions (code) on delete cascade,
  round int not null,
  voter_id uuid not null references public.cc_players (id) on delete cascade,
  target_id uuid not null references public.cc_players (id) on delete cascade,
  primary key (voter_id, round)
);

create table if not exists public.cc_rescues (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.cc_sessions (code) on delete cascade,
  player_id uuid not null references public.cc_players (id) on delete cascade,
  section int not null,
  auditor boolean not null default false,
  answer text not null check (char_length(answer) between 1 and 400),
  status text not null default 'pendiente' check (status in ('pendiente', 'correcta', 'incorrecta')),
  at timestamptz not null default now(),
  unique (player_id, section)
);

create table if not exists public.cc_sales (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.cc_sessions (code) on delete cascade,
  merchant_id uuid not null references public.cc_players (id) on delete cascade,
  seller_id uuid not null references public.cc_players (id) on delete cascade,
  criteria jsonb not null default '[]',
  convinced boolean not null,
  at timestamptz not null default now(),
  unique (merchant_id, seller_id)
);

alter table public.cc_sessions enable row level security;
alter table public.cc_private enable row level security;
alter table public.cc_players enable row level security;
alter table public.cc_votes enable row level security;
alter table public.cc_rescues enable row level security;
alter table public.cc_sales enable row level security;

-- Solo la fila pública de la sesión se puede leer (y escuchar por Realtime).
-- Las demás tablas no tienen ninguna política: nadie las lee directo.
drop policy if exists "read cc sessions" on public.cc_sessions;
create policy "read cc sessions" on public.cc_sessions for select using (true);
do $$
begin
  grant select on public.cc_sessions to anon, authenticated;
exception when undefined_object then null;
end $$;

-- ── Ayudantes (no se exponen) ────────────────────────────────────────────────

create or replace function public.cc_norm(p text) returns text language sql immutable as $$
  select btrim(regexp_replace(
    translate(lower(p), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '\s+', ' ', 'g'))
$$;

create or replace function public.cc_auth(p_code text, p_key text) returns void language plpgsql as $$
begin
  if not exists (select 1 from cc_private k where k.code = p_code and k.host_key = p_key) then
    raise exception 'No autorizado';
  end if;
end $$;

create or replace function public.cc_open(p_code text) returns cc_sessions language plpgsql as $$
declare s cc_sessions;
begin
  select * into s from cc_sessions where code = p_code for update;
  if s.code is null or s.status <> 'jugando' then
    raise exception 'La sesión no está abierta';
  end if;
  return s;
end $$;

create or replace function public.cc_me_row(p_code text, p_token uuid) returns cc_players language plpgsql as $$
declare p cc_players;
begin
  select * into p from cc_players where id = p_token and session_code = p_code;
  if p.id is null then
    raise exception 'No encontramos a tu personaje';
  end if;
  return p;
end $$;

create or replace function public.cc_bump(p_code text) returns void language sql as $$
  update cc_sessions set rev = rev + 1 where code = p_code
$$;

create or replace function public.cc_award(p_code text, p_ids uuid[], p_pts int) returns void language sql as $$
  update cc_players set points = points + p_pts
   where session_code = p_code and id = any (p_ids)
     and (select points_on from cc_sessions where code = p_code)
$$;

create or replace function public.cc_session_json(s cc_sessions) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'code', s.code, 'status', s.status, 'total', s.total, 'section', s.section,
    'roundOpen', s.round_open, 'voteRound', s.vote_round, 'voteOpen', s.vote_open,
    'pointsOn', s.points_on, 'saleOpen', s.sale_open, 'rev', s.rev)
$$;

create or replace function public.cc_player_json(p cc_players) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', p.id, 'num', p.num, 'name', p.name, 'role', p.role, 'decoy', p.decoy,
    'auditor', p.auditor, 'points', p.points,
    'joinedAt', (extract(epoch from p.joined_at) * 1000)::bigint)
$$;

-- ── Host ─────────────────────────────────────────────────────────────────────

create or replace function public.cc_create(p_code text, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into cc_sessions (code) values (p_code);
  insert into cc_private (code, host_key) values (p_code, p_key);
end $$;

create or replace function public.cc_confirm(p_code text, p_key text, p_slots jsonb, p_overflow jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare s cc_sessions;
begin
  perform cc_auth(p_code, p_key);
  select * into s from cc_sessions where code = p_code for update;
  if s.status <> 'registro' then raise exception 'Los roles ya se repartieron'; end if;
  if jsonb_array_length(p_slots) < 1 then raise exception 'Registra al menos a una persona'; end if;
  if jsonb_array_length(p_overflow) < 1 or p_overflow ? 'phishing' then
    raise exception 'Quien llega tarde no puede ser phishing';
  end if;
  update cc_private set slots = p_slots, overflow = p_overflow where code = p_code;
  update cc_sessions set status = 'jugando', total = jsonb_array_length(p_slots), rev = rev + 1 where code = p_code;
end $$;

create or replace function public.cc_set(p_code text, p_key text, p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  v_section int;
  v_vote boolean;
begin
  perform cc_auth(p_code, p_key);
  s := cc_open(p_code);
  v_section := coalesce((p_patch ->> 'section')::int, s.section);
  if v_section < 0 or v_section > 6 then raise exception 'Sección inválida'; end if;
  v_vote := coalesce((p_patch ->> 'voteOpen')::boolean, s.vote_open);
  update cc_sessions set
    section = v_section,
    round_open = coalesce((p_patch ->> 'roundOpen')::boolean, round_open),
    points_on = coalesce((p_patch ->> 'pointsOn')::boolean, points_on),
    sale_open = coalesce((p_patch ->> 'saleOpen')::boolean, sale_open),
    vote_open = v_vote,
    -- Abrir la votación empieza una ronda nueva: cada quien vota una vez por ronda.
    vote_round = case when v_vote and not s.vote_open then vote_round + 1 else vote_round end,
    rev = rev + 1
  where code = p_code;
end $$;

create or replace function public.cc_host_view(p_code text, p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s cc_sessions;
begin
  perform cc_auth(p_code, p_key);
  select * into s from cc_sessions where code = p_code;
  return jsonb_build_object(
    'session', cc_session_json(s),
    'players', coalesce((select jsonb_agg(cc_player_json(p) order by p.num) from cc_players p where p.session_code = p_code), '[]'),
    'votes', coalesce((select jsonb_agg(jsonb_build_object('round', v.round, 'voterId', v.voter_id, 'targetId', v.target_id))
                         from cc_votes v where v.session_code = p_code), '[]'),
    'rescues', coalesce((select jsonb_agg(jsonb_build_object(
                           'id', r.id, 'playerId', r.player_id, 'section', r.section, 'auditor', r.auditor,
                           'answer', r.answer, 'status', r.status,
                           'at', (extract(epoch from r.at) * 1000)::bigint) order by r.at)
                         from cc_rescues r where r.session_code = p_code), '[]'),
    'sales', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', x.id, 'merchantId', x.merchant_id, 'sellerId', x.seller_id, 'criteria', x.criteria,
                         'convinced', x.convinced, 'at', (extract(epoch from x.at) * 1000)::bigint) order by x.at)
                       from cc_sales x where x.session_code = p_code), '[]'));
end $$;

create or replace function public.cc_mark_rescue(p_code text, p_key text, p_rescue uuid, p_ok boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r cc_rescues;
begin
  perform cc_auth(p_code, p_key);
  perform cc_open(p_code);
  select * into r from cc_rescues where id = p_rescue and session_code = p_code for update;
  if r.id is null then raise exception 'Ese rescate no existe'; end if;
  if r.status <> 'pendiente' then return; end if;
  update cc_rescues set status = case when p_ok then 'correcta' else 'incorrecta' end where id = p_rescue;
  if p_ok then perform cc_award(p_code, array[r.player_id], 2); end if;
  perform cc_bump(p_code);
end $$;

create or replace function public.cc_set_auditor(p_code text, p_key text, p_player uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform cc_auth(p_code, p_key);
  perform cc_open(p_code);
  update cc_players set auditor = p_on where id = p_player and session_code = p_code;
  if not found then raise exception 'Ese jugador no existe'; end if;
  perform cc_bump(p_code);
end $$;

create or replace function public.cc_close(p_code text, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform cc_auth(p_code, p_key);
  delete from cc_players where session_code = p_code; -- en cascada: votos, rescates, ventas
  update cc_private set slots = '[]', overflow = '[]' where code = p_code;
  update cc_sessions set status = 'cerrada', vote_open = false, round_open = false, sale_open = false, rev = rev + 1
   where code = p_code;
end $$;

-- ── Celular ──────────────────────────────────────────────────────────────────

create or replace function public.cc_join(p_code text, p_name text, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_norm text := cc_norm(v_name);
  v_existing cc_players;
  v_num int;
  v_slots jsonb;
  v_overflow jsonb;
  v_role text;
  v_decoy text;
  v_id uuid;
begin
  perform cc_open(p_code); -- bloquea la sesión: dos celulares nunca reciben el mismo número
  if v_name = '' then raise exception 'Escribe tu nombre'; end if;
  select * into v_existing from cc_players where session_code = p_code and name_norm = v_norm;
  if v_existing.id is not null then
    if p_claim then return jsonb_build_object('status', 'ok', 'token', v_existing.id); end if;
    return jsonb_build_object('status', 'exists', 'num', v_existing.num);
  end if;
  select count(*) + 1 into v_num from cc_players where session_code = p_code;
  select slots, overflow into v_slots, v_overflow from cc_private where code = p_code;
  if v_num <= jsonb_array_length(v_slots) then
    v_role := v_slots -> (v_num - 1) ->> 'role';
    v_decoy := v_slots -> (v_num - 1) ->> 'decoy';
  else
    -- Llegó tarde: un rol de la lista, nunca phishing.
    v_role := v_overflow ->> ((v_num - jsonb_array_length(v_slots) - 1) % jsonb_array_length(v_overflow));
    v_decoy := null;
  end if;
  insert into cc_players (session_code, num, name, name_norm, role, decoy)
  values (p_code, v_num, v_name, v_norm, v_role, v_decoy) returning id into v_id;
  perform cc_bump(p_code);
  return jsonb_build_object('status', 'ok', 'token', v_id);
end $$;

create or replace function public.cc_me(p_code text, p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
begin
  select * into me from cc_players where id = p_token and session_code = p_code;
  if me.id is null then return null; end if;
  select * into s from cc_sessions where code = p_code;
  return jsonb_build_object(
    'session', cc_session_json(s),
    'me', cc_player_json(me),
    'roster', coalesce((select jsonb_agg(jsonb_build_object(
                          'num', p.num, 'auditor', p.auditor,
                          'wasPhishing', case when p.auditor then p.role = 'phishing' else null end) order by p.num)
                        from cc_players p where p.session_code = p_code), '[]'),
    'votedFor', (select t.num from cc_votes v join cc_players t on t.id = v.target_id
                  where v.voter_id = me.id and v.round = s.vote_round),
    'rescues', coalesce((select jsonb_agg(jsonb_build_object('section', r.section, 'auditor', r.auditor, 'status', r.status))
                         from cc_rescues r where r.player_id = me.id), '[]'),
    'judged', coalesce((select jsonb_agg(t.num) from cc_sales x join cc_players t on t.id = x.seller_id
                        where x.merchant_id = me.id), '[]'));
end $$;

create or replace function public.cc_vote(p_code text, p_token uuid, p_target int)
returns void language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
  v_target uuid;
begin
  s := cc_open(p_code);
  me := cc_me_row(p_code, p_token);
  if not s.vote_open then raise exception 'La votación está cerrada'; end if;
  select id into v_target from cc_players where session_code = p_code and num = p_target;
  if v_target is null then raise exception 'Ese jugador no existe'; end if;
  if v_target = me.id then raise exception 'No puedes votar por ti'; end if;
  if exists (select 1 from cc_votes where voter_id = me.id and round = s.vote_round) then
    raise exception 'Ya votaste en esta ronda';
  end if;
  insert into cc_votes (session_code, round, voter_id, target_id) values (p_code, s.vote_round, me.id, v_target);
  perform cc_award(p_code, array[me.id], 1);
  perform cc_bump(p_code);
end $$;

create or replace function public.cc_rescue(p_code text, p_token uuid, p_answer text)
returns void language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
  v_answer text := left(btrim(coalesce(p_answer, '')), 400);
begin
  s := cc_open(p_code);
  me := cc_me_row(p_code, p_token);
  -- Secciones con rescate: Quiénes somos (0), Promesa (2), Ciberseguridad (5), TP (6). Igual que RESCUE_SECTIONS.
  if not (s.section = any (array[0, 2, 5, 6])) then
    raise exception 'Esta sección no tiene pregunta rescate';
  end if;
  if v_answer = '' then raise exception 'Escribe tu respuesta'; end if;
  if exists (select 1 from cc_rescues where player_id = me.id and section = s.section) then
    raise exception 'Ya pediste el rescate de esta sección';
  end if;
  insert into cc_rescues (session_code, player_id, section, auditor, answer)
  values (p_code, me.id, s.section, me.auditor, v_answer);
  perform cc_award(p_code, array[me.id], 1);
  perform cc_bump(p_code);
end $$;

create or replace function public.cc_sale(p_code text, p_token uuid, p_seller int, p_criteria jsonb, p_convinced boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
  v_seller uuid;
begin
  s := cc_open(p_code);
  me := cc_me_row(p_code, p_token);
  if not s.sale_open then raise exception 'La venta no está abierta'; end if;
  if me.role not in ('merchant_fan', 'merchant_desconfiado', 'merchant_confuso') then
    raise exception 'Solo un merchant decide la venta';
  end if;
  select id into v_seller from cc_players where session_code = p_code and num = p_seller;
  if v_seller is null or v_seller = me.id then raise exception 'Elige a quien te vendió'; end if;
  if exists (select 1 from cc_sales where merchant_id = me.id and seller_id = v_seller) then
    raise exception 'Ya calificaste a esa persona';
  end if;
  insert into cc_sales (session_code, merchant_id, seller_id, criteria, convinced)
  values (p_code, me.id, v_seller,
          coalesce((select jsonb_agg(c) from jsonb_array_elements_text(p_criteria) c
                     where c in ('dato', 'beneficio', 'seguridad', 'escucha')), '[]'),
          p_convinced);
  perform cc_award(p_code, array[me.id, v_seller], 1);
  perform cc_bump(p_code);
end $$;

-- ── Permisos ─────────────────────────────────────────────────────────────────

do $$
declare f text;
begin
  -- Ayudantes: nadie los llama desde fuera.
  foreach f in array array[
    'cc_norm(text)', 'cc_auth(text, text)', 'cc_open(text)', 'cc_me_row(text, uuid)', 'cc_bump(text)',
    'cc_award(text, uuid[], int)', 'cc_session_json(cc_sessions)', 'cc_player_json(cc_players)']
  loop
    execute format('revoke all on function public.%s from public', f);
    begin
      execute format('revoke all on function public.%s from anon, authenticated', f);
    exception when undefined_object then null;
    end;
  end loop;
  -- Las funciones del juego: cualquiera con la llave o el token correcto.
  foreach f in array array[
    'cc_create(text, text)', 'cc_confirm(text, text, jsonb, jsonb)', 'cc_set(text, text, jsonb)',
    'cc_host_view(text, text)', 'cc_mark_rescue(text, text, uuid, boolean)',
    'cc_set_auditor(text, text, uuid, boolean)', 'cc_close(text, text)', 'cc_join(text, text, boolean)',
    'cc_me(text, uuid)', 'cc_vote(text, uuid, int)', 'cc_rescue(text, uuid, text)',
    'cc_sale(text, uuid, int, jsonb, boolean)']
  loop
    execute format('revoke all on function public.%s from public', f);
    begin
      execute format('grant execute on function public.%s to anon, authenticated', f);
    exception when undefined_object then null;
    end;
  end loop;
end $$;

-- Realtime: los celulares y el host escuchan solo la fila pública de la sesión.
do $$
begin
  alter publication supabase_realtime add table public.cc_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
