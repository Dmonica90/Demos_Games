import type { CaseDef } from '../../cases/types';
import { Brand } from '../../components/game';

export function Waiting({ def, nickname }: { def: CaseDef; nickname: string }) {
  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Brand />
      <h1 className="mt-2 text-3xl">
        Hola, <span className="text-brand">{nickname}</span>
      </h1>
      <p className="mt-3 flex items-center gap-2 rounded-full bg-panel px-4 py-2 text-sm font-medium text-ink shadow-sm" role="status">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-safe" />
        Ya estás en la sala. Espera a que el host inicie la actividad.
      </p>

      <section className="card mt-6 p-6">
        <p className="eyebrow">
          Caso {def.number} · {def.relation}
        </p>
        <h2 className="mt-1 text-xl">{def.title}</h2>
        <p className="mt-3 leading-relaxed">{def.context}</p>
        <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm text-accent-deep">
          <strong>Tu objetivo: </strong>
          {def.goal}
        </p>
      </section>

      <section className="mt-6 text-sm">
        <h3 className="text-base">Cómo funciona 🎯</h3>
        <ol className="mt-3 space-y-3">
          {[
            'Empiezas con 100 puntos y la barra en verde.',
            `Escribe libremente: ${def.partner.name} reaccionará según cómo comuniques.`,
            'Si la barra baja a amarillo ya no vuelve a verde, pero aún puedes evitar el rojo y cerrar un acuerdo.',
            `Tienes ${def.maxTurns} mensajes y ${Math.round(def.durationS / 60)} minutos.`,
          ].map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-1">{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
