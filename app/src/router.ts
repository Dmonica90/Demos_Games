import { useEffect, useState } from 'react';

/**
 * Hash routes, so a link straight to a phone screen works on a static host
 * (GitHub Pages answers 404 to unknown paths but never sees the hash):
 *   #/              host: choose a case
 *   #/host/K7P2Q    host: lobby, live dashboard, results
 *   #/jugar/K7P2Q   participant (the QR points here)
 *   #/jugar         participant without a code: type it
 */
export type Route =
  | { name: 'home' }
  | { name: 'host'; code: string }
  | { name: 'play'; code: string | null };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'host' && parts[1]) return { name: 'host', code: parts[1].toUpperCase() };
  if (parts[0] === 'jugar') return { name: 'play', code: parts[1]?.toUpperCase() ?? null };
  return { name: 'home' };
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

/** `?fast=1` skips the typing pauses; the e2e tests use it. */
export const FAST = new URLSearchParams(location.search).has('fast');
