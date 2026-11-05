import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CaseDef } from '../../cases/types';
import { Brand } from '../../components/game';
import { Button } from '../../components/ui';

export function Join({ def, code, onJoin }: { def: CaseDef; code: string; onJoin: (nickname: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const clean = name.trim().replace(/\s+/g, ' ');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clean) return;
    setBusy(true);
    await onJoin(clean.slice(0, 24));
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Brand />
      <h1 className="mt-2 text-3xl font-bold">¡Bienvenido!</h1>
      <p className="mt-2 text-ink-dim">
        Sesión <span className="font-mono font-semibold text-ink">{code}</span> · Caso {def.number}: {def.title}
      </p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <label htmlFor="nickname" className="font-medium">
          Tu nombre o nickname
        </label>
        <input
          id="nickname"
          autoFocus
          autoComplete="nickname"
          maxLength={24}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 rounded-xl border border-edge bg-panel px-4 text-lg outline-none focus:border-accent"
          placeholder="Ej. Ana"
        />
        <Button type="submit" disabled={!clean || busy} onClick={undefined} sfx="confirm">
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}

export function EnterCode({ onCode }: { onCode: (code: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Brand />
      <h1 className="mt-2 text-3xl font-bold">Únete a una sesión</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim().length >= 5) onCode(code);
        }}
        className="mt-8 flex flex-col gap-3"
      >
        <label htmlFor="code" className="font-medium">
          Código de la sesión
        </label>
        <input
          id="code"
          autoFocus
          autoCapitalize="characters"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="min-h-12 rounded-xl border border-edge bg-panel px-4 font-mono text-2xl tracking-[0.3em] uppercase outline-none focus:border-accent"
          placeholder="K7P2Q"
        />
        <Button type="submit" disabled={code.trim().length < 5}>
          Continuar
        </Button>
      </form>
    </main>
  );
}
