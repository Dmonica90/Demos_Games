import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useSound } from '../../audio/SoundProvider';
import type { CaseDef } from '../../cases/types';
import { Avatar, COLOR_LABEL, COLOR_TEXT, ScoreBar } from '../../components/game';
import type { Conversation } from '../../engine/conversation';
import { reply, timeUp } from '../../engine/conversation';
import { formatClock, remainingMs, useNow } from '../../hooks';
import type { Session } from '../../realtime';
import { FAST } from '../../router';
import { Transcript } from '../Transcript';

const MAX_LENGTH = 600;

/** The conversation, phone-first: header, bar, bubbles, and a composer. */
export function Chat({
  def,
  session,
  convo,
  onChange,
}: {
  def: CaseDef;
  session: Session;
  convo: Conversation;
  onChange: (convo: Conversation) => void;
}) {
  const { play } = useSound();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const now = useNow(500);
  const left = remainingMs(session, now);

  useEffect(() => {
    if (left === 0 && !convo.done) onChange(timeUp(convo, Date.now()));
  }, [left, convo, onChange]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [convo.messages.length, typing]);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || typing) return;
    const next = reply(def, convo, text, Date.now());
    setText('');
    play('click');
    // The other person "types" for a moment before the answer appears; the
    // result is saved at once so the dashboard moves immediately.
    setTyping(true);
    onChange({ ...next, done: false });
    setTimeout(
      () => {
        setTyping(false);
        play(next.color !== convo.color ? 'alert' : 'notification');
        onChange(next);
      },
      FAST ? 50 : 900 + Math.min(1600, next.messages[next.messages.length - 1].text.length * 15),
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault();
      send();
    }
  };

  // While "typing", hide the answer that is already computed.
  const shown = typing ? convo.messages.slice(0, -1) : convo.messages;

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="border-b border-edge bg-panel px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Avatar initials={def.partner.initials} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{def.partner.name}</p>
            <p className="truncate text-xs text-ink-dim">
              {typing ? 'escribiendo…' : def.partner.role}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-lg font-bold tabular-nums ${left < 60_000 ? 'text-alarm' : ''}`}>
              {formatClock(left)}
            </p>
            <p className="text-xs text-ink-dim">
              mensaje {Math.min(convo.turn + 1, def.maxTurns)}/{def.maxTurns}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ScoreBar points={convo.points} color={convo.color} />
          <span data-testid="my-points" className="font-mono text-sm font-semibold tabular-nums">
            {convo.points}
          </span>
        </div>
        <p data-testid="my-color" data-color={convo.color} className={`mt-1 text-xs font-medium ${COLOR_TEXT[convo.color]}`}>
          {COLOR_LABEL[convo.color]}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          aria-expanded={contextOpen}
          className="mx-auto mb-4 block rounded-full bg-panel-2 px-4 py-1.5 text-xs text-ink-dim"
        >
          {contextOpen ? 'Ocultar contexto' : `Caso ${def.number}: ${def.title} · ver contexto`}
        </button>
        {contextOpen && (
          <div className="panel mb-4 rounded-2xl p-4 text-sm">
            <p>{def.context}</p>
            <p className="mt-2">
              <strong>Objetivo:</strong> {def.goal}
            </p>
          </div>
        )}
        <div aria-live="polite">
          <Transcript def={def} convo={convo} messages={shown} />
        </div>
        {typing && (
          <p className="mt-3 flex items-center gap-1 pl-10" aria-label={`${def.partner.name} está escribiendo`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot inline-block h-2 w-2 rounded-full bg-ink-dim"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </p>
        )}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-edge bg-panel p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label htmlFor="message" className="sr-only">
          Tu respuesta
        </label>
        <textarea
          id="message"
          rows={2}
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Escribe tu respuesta a ${def.partner.name}…`}
          className="max-h-40 min-h-12 flex-1 resize-none rounded-2xl border border-edge bg-ground px-4 py-3 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!text.trim() || typing}
          className="grid h-12 min-w-12 place-items-center rounded-full bg-accent px-4 font-semibold text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
