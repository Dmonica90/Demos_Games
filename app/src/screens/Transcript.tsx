import type { CaseDef } from '../cases/types';
import { Avatar } from '../components/game';
import type { Conversation, Message } from '../engine/conversation';
import { NEGATIVE, SIGNAL_LABEL } from '../engine/signals';
import type { SignalId } from '../engine/signals';

const CATEGORY_LABEL = { escalate: 'Escala la conversación', unclear: 'Poco claro', effective: 'Efectivo' } as const;
const CATEGORY_TONE = { escalate: 'text-alarm', unclear: 'text-warn', effective: 'text-safe' } as const;

/** The chat as bubbles; with `showSignals`, what was detected in each message. */
export function Transcript({
  def,
  convo,
  messages = convo.messages,
  showSignals = false,
}: {
  def: CaseDef;
  convo: Conversation;
  messages?: Message[];
  showSignals?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Conversación">
      {messages.map((m, i) =>
        m.from === 'partner' ? (
          <li key={i} className="flex max-w-[85%] items-end gap-2 self-start">
            <Avatar initials={def.partner.initials} className="h-8 w-8 text-xs" />
            <p className="rounded-2xl rounded-bl-sm border border-edge bg-bubble-them px-4 py-2.5 leading-snug shadow-sm">
              <span className="sr-only">{def.partner.name}: </span>
              {m.text}
            </p>
          </li>
        ) : (
          <li key={i} className="flex max-w-[85%] flex-col items-end self-end">
            <p className="rounded-2xl rounded-br-sm bg-bubble-me px-4 py-2.5 leading-snug text-white shadow-sm">
              <span className="sr-only">Tú: </span>
              {m.text}
            </p>
            {showSignals && (
              <div className="mt-1 flex flex-wrap justify-end gap-1 text-[0.7rem]">
                <span className={`font-semibold ${CATEGORY_TONE[m.category]}`}>{CATEGORY_LABEL[m.category]}</span>
                {(m.signals as SignalId[])
                  .filter((s) => def.relevant.includes(s))
                  .map((s) => (
                    <span
                      key={s}
                      className={`rounded-full px-2 py-0.5 ${
                        NEGATIVE.includes(s) ? 'bg-alarm/10 text-alarm' : 'bg-safe/10 text-safe'
                      }`}
                    >
                      {SIGNAL_LABEL[s]}
                    </span>
                  ))}
              </div>
            )}
          </li>
        ),
      )}
      {convo.done && convo.endReason === 'time' && (
        <li className="self-center text-sm text-ink-dim">Se acabó el tiempo.</li>
      )}
    </ol>
  );
}
