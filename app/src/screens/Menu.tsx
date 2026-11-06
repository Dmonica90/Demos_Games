import { Brand } from '../components/game';
import { Stagger, StaggerItem } from '../components/ui';

const GAMES = [
  {
    href: '#/simulador',
    emoji: '💬',
    title: 'Simulador de comunicación escrita',
    text: 'Cada persona conversa por chat con un personaje y ve en vivo cómo le va. Tú proyectas el tablero y el ranking.',
    tag: '3 casos · 6 a 8 minutos',
  },
  {
    href: '#/codigo',
    emoji: '🕵️',
    title: 'Código Clip',
    text: 'Juego de inducción: cada quien recibe un personaje y pistas de la presentación, busca a sus aliados y descubre a los phishing.',
    tag: 'Inducción · toda la sesión',
  },
];

/** The start screen: pick which game to host. */
export function Menu() {
  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-4 py-10 sm:px-8">
      <header className="mb-8">
        <Brand label="Clip · Juegos de capacitación" />
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          ¿Qué vamos a <span className="text-brand">jugar?</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg">Elige una actividad. Después proyecta el QR para que cada quien entre desde su celular.</p>
      </header>
      <Stagger as="ul" className="grid gap-5 md:grid-cols-2">
        {GAMES.map((g) => (
          <StaggerItem as="li" key={g.href}>
            <a href={g.href} className="card flex h-full flex-col p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-brand sm:p-9">
              <span aria-hidden="true" className="text-5xl">
                {g.emoji}
              </span>
              <span className="mt-5 text-2xl font-extrabold text-ink">{g.title}</span>
              <span className="mt-3 leading-relaxed">{g.text}</span>
              <span className="mt-auto pt-6 text-sm font-semibold text-accent-deep">{g.tag} →</span>
            </a>
          </StaggerItem>
        ))}
      </Stagger>
    </main>
  );
}
