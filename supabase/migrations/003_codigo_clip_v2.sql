-- Código Clip v2: barras de vida, mínimo 3 jugadores y la pantalla pública.
-- Pégalo completo en Supabase → SQL Editor → New query → Run (después de 002).
-- Es seguro correrlo otra vez.
--
-- Vida: empieza en 100. −10 por cada voto recibido, +15 por rescate correcto,
-- −5 por rescate incorrecto (entre 0 y 100). Con las barras apagadas no cambia.
-- Las reglas son las mismas que app/src/codigo/state.ts.

alter table public.cc_players add column if not exists life int not null default 100;
do $$
begin
  alter table public.cc_players add constraint cc_players_life_range check (life between 0 and 100);
exception when duplicate_object then null;
end $$;

-- Ayudante: cambia la vida de un jugador si las barras están activas.
create or replace function public.cc_life(p_code text, p_id uuid, p_delta int) returns void language sql as $$
  update cc_players set life = greatest(0, least(100, life + p_delta))
   where session_code = p_code and id = p_id
     and (select points_on from cc_sessions where code = p_code)
$$;

create or replace function public.cc_player_json(p cc_players) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', p.id, 'num', p.num, 'name', p.name, 'role', p.role, 'decoy', p.decoy,
    'auditor', p.auditor, 'life', p.life,
    'joinedAt', (extract(epoch from p.joined_at) * 1000)::bigint)
$$;

create or replace function public.cc_confirm(p_code text, p_key text, p_slots jsonb, p_overflow jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare s cc_sessions;
begin
  perform cc_auth(p_code, p_key);
  select * into s from cc_sessions where code = p_code for update;
  if s.status <> 'registro' then raise exception 'Los roles ya se repartieron'; end if;
  if jsonb_array_length(p_slots) < 3 then raise exception 'Se juega con al menos 3 personas'; end if;
  if not exists (select 1 from jsonb_array_elements(p_slots) x where x ->> 'role' = 'phishing') then
    raise exception 'Debe haber al menos un infiltrado';
  end if;
  if jsonb_array_length(p_overflow) < 1 or p_overflow ? 'phishing' then
    raise exception 'Quien llega tarde no puede ser phishing';
  end if;
  update cc_private set slots = p_slots, overflow = p_overflow where code = p_code;
  update cc_sessions set status = 'jugando', total = jsonb_array_length(p_slots), rev = rev + 1 where code = p_code;
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
  perform cc_life(p_code, v_target, -10);
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
  -- Secciones con rescate: Quiénes somos (0), Promesa (2), TP (5), Ciberseguridad (6). Igual que RESCUE_SECTIONS.
  if not (s.section = any (array[0, 2, 5, 6])) then
    raise exception 'Esta sección no tiene pregunta rescate';
  end if;
  if v_answer = '' then raise exception 'Escribe tu respuesta'; end if;
  if exists (select 1 from cc_rescues where player_id = me.id and section = s.section) then
    raise exception 'Ya pediste el rescate de esta sección';
  end if;
  insert into cc_rescues (session_code, player_id, section, auditor, answer)
  values (p_code, me.id, s.section, me.auditor, v_answer);
  perform cc_bump(p_code);
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
  perform cc_life(p_code, r.player_id, case when p_ok then 15 else -5 end);
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
  perform cc_bump(p_code);
end $$;

-- La pantalla que se proyecta: nombres y vida, sin roles ni votos.
create or replace function public.cc_board(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s cc_sessions;
begin
  select * into s from cc_sessions where code = p_code;
  if s.code is null then return null; end if;
  return jsonb_build_object(
    'session', cc_session_json(s),
    'players', coalesce((select jsonb_agg(jsonb_build_object(
                           'num', p.num, 'name', p.name, 'life', p.life, 'auditor', p.auditor,
                           'wasPhishing', case when p.auditor then p.role = 'phishing' else null end)
                           order by p.life desc, p.num)
                         from cc_players p where p.session_code = p_code), '[]'),
    'voted', (select count(*) from cc_votes v where v.session_code = p_code and v.round = s.vote_round));
end $$;

do $$
begin
  revoke all on function public.cc_life(text, uuid, int) from public;
  revoke all on function public.cc_player_json(cc_players) from public;
  revoke all on function public.cc_board(text) from public;
  begin
    revoke all on function public.cc_life(text, uuid, int) from anon, authenticated;
    revoke all on function public.cc_player_json(cc_players) from anon, authenticated;
    grant execute on function public.cc_board(text) to anon, authenticated;
    grant execute on function public.cc_confirm(text, text, jsonb, jsonb) to anon, authenticated;
    grant execute on function public.cc_vote(text, uuid, int) to anon, authenticated;
    grant execute on function public.cc_rescue(text, uuid, text) to anon, authenticated;
    grant execute on function public.cc_mark_rescue(text, text, uuid, boolean) to anon, authenticated;
    grant execute on function public.cc_sale(text, uuid, int, jsonb, boolean) to anon, authenticated;
  exception when undefined_object then null;
  end;
end $$;
