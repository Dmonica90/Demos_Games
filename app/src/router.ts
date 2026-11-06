import { useEffect, useState } from 'react';

/**
 * Hash routes, so a link straight to a phone screen works on a static host
 * (GitHub Pages answers 404 to unknown paths but never sees the hash):
 *   #/              menu: choose a game
 *   #/simulador     host: choose a case
 *   #/host/K7P2Q    host: lobby, live dashboard, results
 *   #/jugar/K7P2Q   participant (the QR points here)
 *   #/jugar         participant without a code: type it
 *   #/laboratorio   facilitator: try the engine and see its memory
 *   #/codigo                 Código Clip host: register the group
 *   #/codigo/host/K7P2Q      Código Clip host: run the session
 *   #/codigo/pantalla/K7P2Q  Código Clip projected screen (QR, section, ranking)
 *   #/codigo/jugar/K7P2Q     Código Clip phone (the QR points here)
 */
export type Route =
  | { name: 'menu' }
  | { name: 'home' }
  | { name: 'cc-new' }
  | { name: 'cc-host'; code: string }
  | { name: 'cc-screen'; code: string }
  | { name: 'cc-play'; code: string | null }
  | { name: 'host'; code: string }
  | { name: 'play'; code: string | null }
  | { name: 'lab' };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'codigo') {
    if (parts[1] === 'host' && parts[2]) return { name: 'cc-host', code: parts[2].toUpperCase() };
    if (parts[1] === 'pantalla' && parts[2]) return { name: 'cc-screen', code: parts[2].toUpperCase() };
    if (parts[1] === 'jugar') return { name: 'cc-play', code: parts[2]?.toUpperCase() ?? null };
    return { name: 'cc-new' };
  }
  if (parts[0] === 'simulador') return { name: 'home' };
  if (parts[0] === 'host' && parts[1]) return { name: 'host', code: parts[1].toUpperCase() };
  if (parts[0] === 'jugar') return { name: 'play', code: parts[1]?.toUpperCase() ?? null };
  if (parts[0] === 'laboratorio') return { name: 'lab' };
  return { name: 'menu' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (hash: string) => {
  location.hash = hash;
};

/** The link the QR encodes: this same site, the participant route. */
export function joinUrl(code: string): string {
  return `${location.origin}${location.pathname}#/jugar/${code}`;
}

/** The link the Código Clip QR encodes. */
export function ccJoinUrl(code: string): string {
  return `${location.origin}${location.pathname}${location.search}#/codigo/jugar/${code}`;
}

/** The public screen to project or share in a call. */
export function ccScreenUrl(code: string): string {
  return `${location.origin}${location.pathname}${location.search}#/codigo/pantalla/${code}`;
}

/** `?fast=1` skips the typing pauses; the e2e tests use it. */
export const FAST = new URLSearchParams(location.search).has('fast');
