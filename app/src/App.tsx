import { useSound } from './audio/SoundProvider';
import { useRoute } from './router';
import { HostHome } from './screens/host/HostHome';
import { HostSession } from './screens/host/HostSession';
import { HostControl } from './screens/codigo/HostControl';
import { HostRegister } from './screens/codigo/HostRegister';
import { Player as CCPlayer } from './screens/codigo/Player';
import { Projection } from './screens/codigo/Projection';
import { Lab } from './screens/Lab';
import { Menu } from './screens/Menu';
import { Play } from './screens/player/Play';

export function App() {
  const route = useRoute();
  return (
    <>
      {route.name === 'menu' && <Menu />}
      {route.name === 'home' && <HostHome />}
      {route.name === 'cc-new' && <HostRegister />}
      {route.name === 'cc-host' && <HostControl key={route.code} code={route.code} />}
      {route.name === 'cc-screen' && <Projection key={route.code} code={route.code} />}
      {route.name === 'cc-play' && <CCPlayer key={route.code ?? ''} code={route.code} />}
      {route.name === 'host' && <HostSession key={route.code} code={route.code} />}
      {route.name === 'play' && <Play key={route.code ?? ''} code={route.code} />}
      {route.name === 'lab' && <Lab />}
      <MuteButton />
    </>
  );
}

function MuteButton() {
  const { muted, toggleMuted } = useSound();
  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-pressed={muted}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      className="fixed right-4 bottom-4 z-40 hidden h-10 w-10 sm:grid place-items-center rounded-full border border-edge bg-panel text-lg shadow-sm sm:bottom-4"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
