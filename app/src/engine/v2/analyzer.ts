import { isShouting, normalize, wordCount } from '../text';
import type { Family } from './config';
import type { Analysis, V2Signal } from './types';

/**
 * Rule-based analyzer. It looks for families of expressions (not single
 * words), several per message, ignores those negated just before ("no
 * entiendo", "no es urgente"), and lifts the concrete facts the character
 * can remember: what is needed, by when, and what part could go first.
 *
 * It approximates intent; it does not understand language. New phrasings
 * found in real sessions go into these lists, with a test.
 */

const rx = (...alts: string[]) => new RegExp(`\\b(?:${alts.join('|')})\\b`, 'g');

/** Families matched on normalised text (lower case, no accents). */
export const FAMILIES: Record<V2Signal, Family> = {
  empathy: {
    negatable: true,
    patterns: rx(
      'entiendo',
      'comprendo',
      'me imagino',
      'imagino',
      'se que (?:estas|tienes|traes|andas|te|has)',
      '(?:estas|andas|te ves) (?:saturad\\w*|ocupad\\w*|con mucho|a tope)',
      'con todo lo que (?:tienes|traes)',
      '(?:la|tu) carga',
      'otras prioridades',
      'tiene sentido',
      'es normal',
      'lamento',
      'que pena',
      'como estas',
      'como vas',
      'te puedo ayudar',
      'en que te (?:puedo )?ayud\\w*',
      'valoro',
      'aprecio',
    ),
  },
  gratitude: { negatable: false, patterns: rx('gracias', 'te agradezco', 'agradezco') },
  urgency: {
    negatable: true,
    patterns: rx(
      'fecha limite',
      'deadline',
      'vence',
      'se acerca',
      'cerca de la fecha',
      'es urgente',
      'urgencia',
      'cuanto antes',
      'lo antes posible',
      'lo necesito (?:hoy|ya|pronto|para hoy)',
      'lo necesitamos',
      'hoy mismo',
      'el cierre',
      'estamos cerca',
    ),
  },
  impact: {
    negatable: true,
    patterns: rx(
      'depend\\w*',
      'sin (?:esos|esas|ese|esa|los|las|el|la|tus|tu) [a-z]+ no (?:puedo|podemos|podria)',
      'no (?:puedo|podemos|podria) (?:cerrar|terminar|avanzar|entregar|seguir|continuar|presentar)',
      'bloque\\w*',
      'retras\\w* (?:la|el|toda) ?(?:la )?(?:entrega|proyecto|reporte|presentacion)',
      'afect\\w*',
      'impact\\w*',
      'me (?:detiene|frena|atora)',
      'estoy (?:detenid\\w*|atorad\\w*|frenad\\w*)',
      'para (?:poder )?(?:cerrar|terminar|avanzar|entregar|presentar)',
      'el (?:cliente|proyecto|reporte|equipo) (?:depende|espera|necesita)',
    ),
  },
  request: {
    negatable: true,
    patterns: rx(
      'necesito',
      'me falta',
      'me hace falta',
      'requiero',
      'me (?:puedes|podrias) (?:enviar|mandar|pasar|compartir)',
      '(?:puedes|podrias) (?:enviarme|mandarme|pasarme|compartirme)',
    ),
  },
  partial: {
    negatable: true,
    patterns: rx(
      'lo que (?:ya )?(?:tengas|tienes|lleves|llevas)',
      'lo (?:ya )?(?:validado|revisado|que este listo|que esta listo)',
      '(?:una )?version preliminar',
      'un avance',
      'avance parcial',
      'por partes',
      'una parte',
      'parcial\\w*',
      'divid\\w*',
      'el resto (?:despues|manana|luego|mas tarde)',
      'lo demas (?:despues|manana|luego)',
      'primero (?:la|el|lo) ',
    ),
  },
  agreement: {
    negatable: true,
    patterns: rx(
      'quedamos',
      'entonces (?:quedamos|queda|te|me|tu|yo)',
      'de acuerdo',
      'trato hecho',
      'confirm\\w*',
      'te parece (?:bien|si)',
      'acordamos',
      'cuento contigo',
      'me funciona',
      'nos funciona',
    ),
  },
  responsibility: {
    negatable: true,
    patterns: rx(
      'tu me (?:envias|mandas|pasas|compartes)',
      'me (?:envias|mandas|pasas|compartes)',
      'yo (?:me encargo|reviso|integro|cierro|aviso|valido|completo)',
      'me encargo',
      'te encargas',
      'yo lo (?:reviso|integro|completo)',
    ),
  },
  affirm: {
    negatable: false,
    patterns: rx('si', 'claro', 'va', 'perfecto', 'excelente', 'listo', 'me sirve', 'me funciona', 'de acuerdo', 'genial', 'ok'),
  },
  pressure: {
    negatable: false,
    patterns: rx(
      'hazlo como puedas',
      'como sea',
      'me da igual',
      'no me importa',
      'tienes que',
      'ya mismo',
      'ahora mismo',
      'inmediatamente',
      'sin excusas',
      'no es mi problema',
      'exijo',
      'lo quiero (?:hoy|ya)',
      'de una vez',
    ),
  },
  blame: {
    negatable: false,
    patterns: rx(
      'siempre (?:haces|es lo mismo|llegas|te atrasas|igual|lo mismo|pasa)',
      'otra vez',
      'como siempre',
      'es tu (?:problema|culpa|responsabilidad|trabajo|chamba)',
      'por tu culpa',
      'nunca (?:cumples|entregas|llegas|terminas)',
      'deberias (?:de )?haber\\w*',
      'excusas?',
      'pretextos?',
      'no es posible que',
      'no puede ser',
      'te dije',
      'irresponsab\\w*',
    ),
  },
  hostile: {
    negatable: false,
    patterns: rx('inutil\\w*', 'incompetente\\w*', 'flojo', 'floja', 'mediocre\\w*', 'tont[oa]s?', 'estupid\\w*', 'idiota\\w*', 'pesim[oa]', 'ridicul\\w*'),
  },
  vague: {
    negatable: false,
    patterns: rx('cuando puedas', 'como puedas', 'lo que puedas', 'a ver', 'luego vemos', 'ahi vemos', 'ya veremos', 'ni modo', 'no hay problema', 'esta bien', 'no se'),
  },
};

const NEGATORS = new Set(['no', 'nunca', 'tampoco', 'ni', 'sin']);

/** True when one of the matches is not preceded (within 3 words) by a negation. */
function positiveMatch(plain: string, pattern: RegExp, negatable: boolean): boolean {
  pattern.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(plain))) {
    if (!negatable) return true;
    // A pattern that itself starts with a negation ("no puedo cerrar") is not negated by it.
    const before = plain.slice(0, m.index).trim().split(' ').slice(-3);
    if (!before.some((w) => NEGATORS.has(w))) return true;
  }
  return false;
}

const GENERIC = /^(?:la |el |los |las |esa |ese |esos |esas |tu |tus )?(?:informacion|info|datos|cosas?|eso|esto|archivo|documento|parte)$/;

/** Extracted on lower-cased original text, so accents survive for display. */
const DELIVERABLE =
  /(?:necesito|me falta|me hace falta|requiero|enviarme|mandarme|pasarme|compartirme|enviar|mandar|pasar|compartir)\s+((?:los|las|el|la|esos|esas|ese|esa|tus|tu)\s+[a-záéíóúñü]+(?:\s+(?:de|del|para)\s+(?:la\s+|el\s+|los\s+|las\s+)?[a-záéíóúñü]+)?)/;

const TIME_WORD = '(?:\\d{1,2}(?::\\d{2})?\\s?(?:am|pm|hrs?|horas)?|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)';
const DEADLINE = new RegExp(
  [
    `(?:hoy|mañana|manana|pasado mañana|el (?:lunes|martes|miércoles|miercoles|jueves|viernes))(?:\\s+(?:a las|antes de las|a más tardar a las|a mas tardar a las|como a las)\\s+${TIME_WORD}|\\s+(?:por|en) la (?:mañana|manana|tarde)|\\s+(?:al|a) mediodía|\\s+(?:al|a) mediodia|\\s+temprano|\\s+a primera hora)?`,
    `antes de las\\s+${TIME_WORD}`,
    `a las\\s+${TIME_WORD}`,
    `en (?:\\d+|una|un|dos|tres) (?:horas?|días?|dias?|minutos?)`,
    `(?:al|a) (?:mediodía|mediodia)`,
    `(?:al )?(?:final|fin) del día`,
    `(?:al )?(?:final|fin) del dia`,
    `a primera hora`,
    `esta semana`,
  ].join('|'),
  'g',
);

/** Builds a family from alternatives, for case configs. */
export const family = (negatable: boolean, ...alternatives: string[]): Family => ({
  patterns: rx(...alternatives),
  negatable,
});

const DEFAULT_CONCRETE = [{ signal: 'request', minStrength: 1 }, { signal: 'deadline' }, { signal: 'partial' }];

export function analyze(
  text: string,
  extra: Record<V2Signal, Family> = {},
  concrete: { signal: string; minStrength?: number }[] = DEFAULT_CONCRETE,
): Analysis {
  const plain = normalize(text);
  const lower = text.toLowerCase();
  const signals: Analysis['signals'] = {};

  for (const [id, fam] of Object.entries({ ...FAMILIES, ...extra })) {
    if (positiveMatch(plain, fam.patterns, fam.negatable)) signals[id] = 1;
  }

  // "Entiendo" negated means confusion, not empathy.
  if (/\bno (?:entiendo|comprendo|se que)\b/.test(plain)) signals.vague = 1;

  const deliverableMatch = lower.match(DELIVERABLE);
  let deliverable: string | undefined;
  if (deliverableMatch) {
    deliverable = deliverableMatch[1].trim();
    const generic = GENERIC.test(normalize(deliverable));
    signals.request = generic ? 0.5 : 1;
  } else if (signals.request) {
    signals.request = 0.5;
  }

  // With two times ("lo validado hoy y el resto mañana a las 11") the first is
  // for the partial delivery and the last is the deadline for everything.
  const times = [...lower.matchAll(DEADLINE)].map((m) => m[0].trim());
  const deadline = times.length ? times[times.length - 1] : undefined;
  const partialWhen = times.length > 1 ? times[0] : undefined;
  if (deadline) signals.deadline = 1;

  let partial: string | undefined;
  if (signals.partial) {
    partial = /validad|revisad/.test(plain)
      ? 'lo que ya tengo validado'
      : /preliminar/.test(plain)
        ? 'una versión preliminar'
        : 'lo que ya tengo listo';
  }

  if (/[?¿]/.test(text)) signals.question = 1;
  if (isShouting(text) || /!{2,}/.test(text)) signals.shouting = 1;

  const words = wordCount(text);
  if (words < 6) signals.short = 1;
  // "Affirm" only means something in a short reply ("sí, va"), not inside a long message.
  if (signals.affirm && words > 12) delete signals.affirm;
  // Vague only if the message carries nothing concrete.
  const hasSubstance = concrete.some((c) => (signals[c.signal] ?? 0) >= (c.minStrength ?? 0.5));
  if (signals.vague && hasSubstance) delete signals.vague;
  if (!signals.vague && signals.short && !signals.affirm && !hasSubstance) signals.vague = 1;

  return { signals, deliverable, deadline, partial, partialWhen, words };
}
