import { CASE_BY_ID } from '../../cases';
import { Brand } from '../../components/game';
import { store, usePlayers, useSession } from '../../hooks';
import { Dashboard } from './Dashboard';
import { Lobby } from './Lobby';
import { Results } from './Results';

/** One URL for the whole session; what it shows follows the session's status. */
export function HostSession({ code }: { code: string }) {
  const { session, error } = useSession(code);
  const players = usePlayers(code);
  const hostKey = store.get(`host:${code}`);

  if (error) return <Notice title="No se pudo conectar" body={error} />;
  if (session === undefined) return <Notice title="Cargando sesión…" />;
  if (session === null) return <Notice title="Sesión no encontrada" body={`No existe una sesión con el código ${code}.`} />;

  const def = CASE_BY_ID[session.caseId];
  const props = { session, def, players, hostKey };
  if (session.status === 'lobby') return <Lobby {...props} />;
  if (session.status === 'running') return <Dashboard {...props} />;
  return <Results {...props} />;
}

export function Notice({ title, body }: { title: string; body?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Brand />
        <h1 className="mt-3 text-2xl font-bold">{title}</h1>
        {body && <p className="mt-2 text-ink-dim">{body}</p>}
        <a href="#/" className="mt-6 inline-block text-accent underline">
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
