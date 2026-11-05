import { useCallback, useEffect, useRef, useState } from 'react';
import { CASE_BY_ID } from '../../cases';
import type { Conversation } from '../../engine/conversation';
import { start, timeUp } from '../../engine/conversation';
import { store, useSession } from '../../hooks';
import { normalizeCode, transport } from '../../realtime';
import type { Player } from '../../realtime';
import { go } from '../../router';
import { Notice } from '../host/HostSession';
import { Chat } from './Chat';
import { Done } from './Done';
import { EnterCode, Join } from './Join';
import { Waiting } from './Waiting';

const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
      );

/** The participant's phone, from the QR link to the final result. */
export function Play({ code }: { code: string | null }) {
  if (!code) return <EnterCode onCode={(c) => go(`/jugar/${normalizeCode(c)}`)} />;
  return <PlaySession code={code} />;
}

function PlaySession({ code }: { code: string }) {
  const { session, error } = useSession(code);
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = useRef<Player | null>(null);
  latest.current = player ?? null;

  // Coming back after a reload: the same phone keeps its place.
  useEffect(() => {
    const id = store.get(`player:${code}`);
    if (!id) return setPlayer(null);
    transport
      .getPlayer(code, id)
      .then((p) => setPlayer(p))
      .catch(() => setPlayer(null));
  }, [code]);

  const save = useCallback(async (next: Player) => {
    setPlayer(next);
    try {
      await transport.savePlayer(next);
      setSaveError(null);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }, []);

  const join = async (nickname: string) => {
    const p: Player = { id: newId(), sessionCode: code, nickname, joinedAt: Date.now(), convo: null };
    store.set(`player:${code}`, p.id);
    await save(p);
  };

  const update = useCallback(
    (convo: Conversation) => {
      const current = latest.current;
      if (current) void save({ ...current, convo });
    },
    [save],
  );

  const def = session ? CASE_BY_ID[session.caseId] : null;

  // The activity starts: everyone gets the same opening message.
  useEffect(() => {
    if (session?.status === 'running' && def && player && !player.convo) {
      update(start(def, session.startedAt ?? Date.now()));
    }
  }, [session?.status, session?.startedAt, def, player, update]);

  // The host ended the activity: close whatever is still open.
  useEffect(() => {
    if (session?.status === 'finished' && player?.convo && !player.convo.done) update(timeUp(player.convo, Date.now()));
  }, [session?.status, player?.convo, update]);

  if (error) return <Notice title="No se pudo conectar" body={error} />;
  if (session === undefined || player === undefined) return <Notice title="Conectando…" />;
  if (session === null || !def)
    return <Notice title="Código no válido" body={`No encontramos la sesión ${code}. Revisa el código con el host.`} />;

  if (!player) {
    if (session.status === 'finished') return <Notice title="La actividad ya terminó" />;
    return <Join def={def} code={code} onJoin={join} />;
  }

  const banner = saveError && (
    <p role="alert" className="bg-alarm px-4 py-2 text-center text-sm text-white">
      Sin conexión: tus respuestas se enviarán al reconectar. ({saveError})
    </p>
  );

  if (!player.convo) {
    if (session.status === 'finished') return <Notice title="La actividad ya terminó" />;
    return (
      <>
        {banner}
        <Waiting def={def} nickname={player.nickname} />
      </>
    );
  }
  if (player.convo.done) return <Done def={def} player={player} convo={player.convo} />;
  return (
    <>
      {banner}
      <Chat def={def} session={session} convo={player.convo} onChange={update} />
    </>
  );
}
