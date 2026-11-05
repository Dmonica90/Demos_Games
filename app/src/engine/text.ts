/**
 * Free text is matched after normalizing it: lower case, no accents (so "ñ"
 * becomes "n" and "mañana" is "manana"), single spaces. Every pattern in the
 * dictionaries is written in that normalized form.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** One regular expression matching any of the alternatives as whole words. */
export function words(...alternatives: string[]): RegExp {
  return new RegExp(`\\b(?:${alternatives.join('|')})\\b`);
}

export function wordCount(text: string): number {
  return normalize(text).split(' ').filter((w) => /[a-z0-9]/.test(w)).length;
}

/** More than half the letters in capitals, in a message long enough to tell. */
export function isShouting(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (letters.length < 8) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length;
  return upper / letters.length > 0.6;
}
