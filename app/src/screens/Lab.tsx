import { useState } from 'react';
import type { FormEvent } from 'react';
import { CASES, CASE_BY_ID } from '../cases';
import type { CaseId } from '../cases/types';
import { Brand, COLOR_LABEL, COLOR_TEXT, ScoreBar } from '../components/game';
import { Button } from '../components/ui';
import { reply, start } from '../engine/conversation';
import type { Conversation } from '../engine/conversation';
import { QUADRANT_LABEL } from '../engine/v2/engine';
import { Transcript } from './Transcript';

/** Test answers per case: the five from the engine design for case 1, and five typical ones for 2 and 3. */
const SAMPLES: Record<CaseId, { label: string; text: string }[]> = {
  entrega: [
  {
    label: 'Empática y concreta',
    text: 'Entiendo que estés saturado. Para cerrar el proyecto necesito los datos de ventas. ¿Puedes enviarme lo que ya está validado hoy y completar el resto mañana a las 11?',
  },
  { label: 'Agresiva', text: 'Siempre haces lo mismo, es tu problema, hazlo como puedas.' },
  { label: 'Ambigua', text: 'Ok, cuando puedas.' },
  {
    label: 'Directa y efectiva',
    text: 'Necesito los datos de ventas para cerrar el reporte del cliente. ¿Me envías lo que tengas antes de las 4 y el resto mañana a primera hora?',
  },
  { label: 'Empática sin acuerdo', text: 'Entiendo que tienes mucha carga, gracias por avisarme.' },
  ],
  urgente: [
    {
      label: 'Expone carga y prioriza',
      text: 'Con gusto apoyo, pero ya tengo dos entregables en curso para esta semana y me preocupa que alguno se retrase. ¿Cuál prefieres que priorice?',
    },
    { label: 'Acepta sin explicar', text: 'Sí claro, sin problema, mañana lo tienes.' },
    { label: '"No puedo" seco', text: 'No puedo, no me toca.' },
    { label: 'Propone opciones', text: 'Te propongo mover el reporte mensual al lunes y entregarte lo nuevo mañana a mediodía.' },
    { label: 'Ambigua', text: 'Ok, a ver.' },
  ],
  mejorar: [
    {
      label: 'Hechos y escucha',
      text: 'Valoro tu esfuerzo. En los últimos tres reportes encontré errores en las cifras que generaron retrabajo al equipo. ¿Cómo lo ves tú?',
    },
    { label: 'Etiqueta', text: 'Eres muy descuidado, siempre te equivocas.' },
    { label: 'Evita el tema', text: 'No te preocupes, no es tan importante, sigue así.' },
    {
      label: 'Acciones y apoyo',
      text: 'Podemos usar una lista de verificación antes de enviar y te apoyo la primera semana.',
    },
    { label: 'Seguimiento', text: 'Revisemos cómo vas el próximo viernes.' },
  ],
};

const CHARACTER_LABEL: Record<string, string> = {
  stress: 'Estrés',
  trust: 'Confianza',
  defensiveness: 'Defensividad',
  willingness: 'Disposición a ayudar',
};

/**
 * For the facilitator: play case 1 alone and watch the engine's memory, the
 * colleague's mood and the task move with every message. Nothing is saved.
 */
export function Lab() {
  const [caseId, setCaseId] = useState<CaseId>('entrega');
  const def = CASE_BY_ID[caseId];
  const [convo, setConvo] = useState<Conversation>(() => start(CASE_BY_ID.entrega, Date.now()));
  const [text, setText] = useState('');
  const v2 = convo.v2!;
  const choose = (id: CaseId) => {
    setCaseId(id);
    setConvo(start(CASE_BY_ID[id], Date.now()));
    setText('');
  };

  const send = (message: string) => {
    if (!message.trim() || convo.done) return;
    setConvo((c) => reply(def, c, message, Date.now()));
    setText('');
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex flex-col">
        <Brand />
        <h1 className="mt-2 text-3xl">
          Laboratorio · <span className="text-brand">{def.title}</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Caso">
          {CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === caseId}
              onClick={() => choose(c.id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
                c.id === caseId ? 'border-accent bg-accent-soft text-accent-deep' : 'border-edge bg-panel text-ink'
              }`}
            >
              Caso {c.number}: {c.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm">
          Prueba el motor como participante y mira cómo cambian la memoria, el estado de la tarea y el ánimo de{' '}
          {def.partner.name}. Nada se guarda.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <ScoreBar points={convo.points} color={convo.color} />
          <span className="font-extrabold text-ink">{convo.points}</span>
        </div>
        <p className={`mt-1 text-xs font-bold ${COLOR_TEXT[convo.color]}`}>{COLOR_LABEL[convo.color]}</p>

        <div className="card mt-4 flex-1 p-5">
          <Transcript def={def} convo={convo} showSignals />
          {convo.done && convo.quadrant && (
            <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm text-accent-deep">
              <strong className="block text-ink">{QUADRANT_LABEL[convo.quadrant].title}</strong>
              {QUADRANT_LABEL[convo.quadrant].text} · Misión: {convo.mission ? '✔ acuerdo' : '✗ sin acuerdo'}
            </p>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <label htmlFor="lab-message" className="sr-only">
            Mensaje
          </label>
          <textarea
            id="lab-message"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={convo.done}
            placeholder={convo.done ? 'Conversación terminada' : `Escribe a ${def.partner.name}…`}
            className="min-h-12 flex-1 resize-none rounded-2xl border-2 border-edge bg-panel px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <Button type="submit" disabled={!text.trim() || convo.done}>
            Enviar
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {SAMPLES[caseId].map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={convo.done}
              onClick={() => setText(s.text)}
              className="rounded-full border-2 border-edge bg-panel px-3 py-1 text-xs font-semibold text-ink hover:border-accent disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
          <Button tone="ghost" onClick={() => choose(caseId)} className="!min-h-8 !px-4 !py-1 text-xs">
            Reiniciar
          </Button>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <section className="card p-5">
          <p className="eyebrow">Memoria · turno {v2.turn}/{def.maxTurns}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {def.v2.flags.map(({ id: k, label }) => {
              const on = v2.memory.flags[k] === true;
              return (
                <li
                  key={k}
                  data-memory={k}
                  data-on={on}
                  className={`rounded-xl border-2 px-3 py-1.5 ${on ? 'border-safe bg-[#ecfdf5] text-safe-ink' : 'border-edge text-ink-dim'}`}
                >
                  {on ? '✔' : '○'} {label}
                </li>
              );
            })}
          </ul>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="font-semibold text-ink">Tarea</dt>
            <dd>{v2.task}</dd>
            <dt className="font-semibold text-ink">Relación</dt>
            <dd>{v2.relationship}</dd>
            <dt className="font-semibold text-ink">Ya preguntó</dt>
            <dd>{v2.memory.asked_topics.join(', ') || '—'}</dd>
            <dt className="font-semibold text-ink">Espera respuesta a</dt>
            <dd>{v2.memory.pending_offer ?? '—'}</dd>
            <dt className="font-semibold text-ink">Datos</dt>
            <dd>
              {Object.entries(v2.memory.slots)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ') || '—'}
            </dd>
          </dl>
        </section>

        <section className="card p-5">
          <p className="eyebrow">Ánimo de {def.partner.name}</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {Object.entries(CHARACTER_LABEL).map(([k, label]) => {
              const value = v2.character[k as keyof typeof v2.character];
              return (
                <li key={k}>
                  <div className="flex justify-between">
                    <span>{label}</span>
                    <strong className="text-ink">{value}</strong>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-edge">
                    <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <details className="card p-5 text-xs">
          <summary className="cursor-pointer font-semibold text-ink">Estado interno (JSON)</summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-inverse p-3 text-[#e2e8f0]">
            {JSON.stringify({ ...v2, criteriaSum: undefined }, null, 2)}
          </pre>
        </details>
      </aside>
    </main>
  );
}
