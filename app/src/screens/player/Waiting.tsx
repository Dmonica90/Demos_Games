import type { CaseDef } from '../../cases/types';
import { Brand } from '../../components/game';

export function Waiting({ def, nickname }: { def: CaseDef; nickname: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Brand />
      <h1 className="mt-2 text-3xl font-bold">Hola, {nickname}</h1>
      <p className="mt-2 flex items-center gap-2 text-ink-dim" role="status">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-safe" />
        Ya estás en la sala. Espera a que el host inicie la actividad.
      </p>

      <section className="panel mt-8 rounded-2xl p-5">
        <p className="text-xs font-semibold text-accent uppercase">
          Caso {def.number} · {def.relation}
        </p>
        <h2 className="mt-1 text-xl font-bold">{def.title}</h2>
        <p className="mt-3 leading-relaxed">{def.context}</p>
        <p className="mt-4 rounded-xl bg-panel-2 p-3 text-sm">
          <strong>Tu objetivo: </strong>
          {def.goal}
        </p>
      </section>

      <section className="mt-6 text-sm text-ink-dim">
        <h3 className="font-semibold text-ink">Cómo funciona</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Empiezas con 100 puntos y la barra en verde.</li>
          <li>Escribe libremente: {def.partner.name} reaccionará según cómo comuniques.</li>
          <li>Si la barra baja a amarillo ya no vuelve a verde, pero aún puedes evitar el rojo y cerrar un acuerdo.</li>
          <li>Tienes {def.maxTurns} mensajes y {Math.round(def.durationS / 60)} minutos.</li>
        </ul>
      </section>
    </main>
  );
}
