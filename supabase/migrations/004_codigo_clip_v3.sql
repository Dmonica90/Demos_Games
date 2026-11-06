-- Código Clip v3: ronda de aliados ("¿quién es de tu equipo?") y nombres en el
-- celular para votar. Pégalo completo en Supabase → SQL Editor → Run (después de 003).
-- Es seguro correrlo otra vez. Las reglas son las de app/src/codigo/state.ts.

create table if not exists public.cc_allies (
  player_id uuid primary key references public.cc_players (id) on delete cascade,
  session_code text not null references public.cc_sessions (code) on delete cascade,
  target_ids uuid[] not null default '{}',
  at timestamptz not null default now()
);
alter table public.cc_allies enable row level security; -- sin políticas: nadie la lee directo

-- Equipo para la ronda de aliados: Comercio, Venta, los phishing entre ellos; persona normal sin equipo.
create or replace function public.cc_team(p_role text) returns text language sql immutable as $$
  select case
    when p_role = 'phishing' then 'phishing'
    when p_role in ('merchant_fan', 'merchant_desconfiado', 'merchant_confuso') then 'comercio'
    when p_role in ('vendedor_clip', 'vendedor_miclip', 'fan_miclip') then 'venta'
    else null end
$$;

create or replace function public.cc_allies(p_code text, p_token uuid, p_nums int[])
returns void language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
  v_ids uuid[];
  v_n int := coalesce(array_length(p_nums, 1), 0);
begin
  s := cc_open(p_code);
  me := cc_me_row(p_code, p_token);
  if not s.sale_open then raise exception 'La ronda de aliados no está abierta'; end if;
  select array_agg(distinct id) into v_ids from cc_players where session_code = p_code and num = any (p_nums);
  if coalesce(array_length(v_ids, 1), 0) <> (select count(distinct x) from unnest(p_nums) x) then
    raise exception 'Ese jugador no existe';
  end if;
  if me.id = any (coalesce(v_ids, '{}')) then raise exception 'No te elijas a ti'; end if;
  if coalesce(array_length(v_ids, 1), 0) > 5 then raise exception 'Elige como máximo 5'; end if;
  insert into cc_allies (player_id, session_code, target_ids, at)
  values (me.id, p_code, coalesce(v_ids, '{}'), now())
  on conflict (player_id) do update set target_ids = excluded.target_ids, at = excluded.at;
  perform cc_bump(p_code);
end $$;

create or replace function public.cc_me(p_code text, p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s cc_sessions;
  me cc_players;
  g cc_allies;
begin
  select * into me from cc_players where id = p_token and session_code = p_code;
  if me.id is null then return null; end if;
  select * into s from cc_sessions where code = p_code;
  select * into g from cc_allies where player_id = me.id;
  return jsonb_build_object(
    'session', cc_session_json(s),
    'me', cc_player_json(me),
    'roster', coalesce((select jsonb_agg(jsonb_build_object(
                          'num', p.num, 'name', p.name, 'auditor', p.auditor,
                          'wasPhishing', case when p.auditor then p.role = 'phishing' else null end) order by p.num)
                        from cc_players p where p.session_code = p_code), '[]'),
    'votedFor', (select t.num from cc_votes v join cc_players t on t.id = v.target_id
                  where v.voter_id = me.id and v.round = s.vote_round),
    'rescues', coalesce((select jsonb_agg(jsonb_build_object('section', r.section, 'auditor', r.auditor, 'status', r.status))
                         from cc_rescues r where r.player_id = me.id), '[]'),
    'myAllies', coalesce((select jsonb_agg(t.num order by t.num) from cc_players t where t.id = any (g.target_ids)), '[]'),
    'allyScore', case when g.player_id is not null and not s.sale_open then jsonb_build_object(
        'right', (select count(*) from cc_players t where t.id = any (g.target_ids)
                   and cc_team(me.role) is not null and cc_team(t.role) = cc_team(me.role)),
        'total', coalesce(array_length(g.target_ids, 1), 0)) else null end);
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
    'allies', coalesce((select jsonb_agg(jsonb_build_object(
                          'playerId', a.player_id, 'targetIds', to_jsonb(a.target_ids),
                          'at', (extract(epoch from a.at) * 1000)::bigint) order by a.at)
                        from cc_allies a where a.session_code = p_code), '[]'));
end $$;

do $$
begin
  revoke all on function public.cc_team(text) from public;
  revoke all on function public.cc_allies(text, uuid, int[]) from public;
  begin
    revoke all on function public.cc_team(text) from anon, authenticated;
    grant execute on function public.cc_allies(text, uuid, int[]) to anon, authenticated;
    grant execute on function public.cc_me(text, uuid) to anon, authenticated;
    grant execute on function public.cc_host_view(text, text) to anon, authenticated;
  exception when undefined_object then null;
  end;
end $$;
