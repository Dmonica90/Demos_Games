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
      'no es facil',
      '(?:ya )?se que (?:no|estas|andas|tienes)',
      '(?:hasta el|a) tope',
      'se te (?:junto|juntaron|cargo)',
      'que pena que',
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
      'para hoy',
      'antes de las',
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
      'se (?:nos |me |le )?(?:retrasa|atrasa|cae|detiene|complica|frena)\\w*',
      '(?:lo|la|se) (?:presento|presenta|expongo|entrego al cliente)',
      '(?:esta|estan) esperando',
      '(?:el|la|mi) (?:cliente|jefe|jefa|director\\w*|gerente) (?:me )?(?:lo )?(?:esta|estan) (?:pidiendo|esperando)',
      'pa (?:terminar|cerrar|avanzar|entregar|seguir)',
      'me urge',
      'porque',
      'ya que',
      'sin (?:eso|esto|esa|ese|tu parte|lo tuyo) no (?:puedo|podemos|podria)',
      'tengo que entregar(?:le|lo|la)?',
      '(?:se|nos|me) (?:quej\\w*|reclam\\w*)',
      'urge',
      'tengo que (?:presentar|exponer)',
      'tengo (?:una )?(?:presentacion|junta|reunion) (?:a las|hoy|manana|con)',
      'presento (?:a las|hoy|manana)',
      'lo necesito para (?:presentar|la junta|la reunion|el cliente|la presentacion)',
    ),
  },
  request: {
    negatable: true,
    patterns: rx(
      'necesito',
      'ocupo',
      'me ocupa',
      'me falta',
      'me hace falta',
      'requiero',
      'me (?:puedes|podrias) (?:enviar|mandar|pasar|compartir)',
      '(?:puedes|podrias) (?:enviarme|mandarme|pasarme|compartirme)',
      'manda(?:lo|la|los|las|me|melo|mela)',
      'envia(?:lo|la|los|las|me|melo|mela)',
      'pasa(?:lo|la|me|melo)',
      'compartelo',
      'entrega(?:lo|la|me|melo)',
      '^(?:por favor )?(?:manda|envia|pasa|entrega|comparte)',
      'me (?:mandas|envias|pasas|compartes|entregas)',
      'cuando (?:puedes|podrias) (?:enviarlo|mandarlo|pasarlo|entregarlo|enviarla|mandarla)',
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
      'primer(?:a)? parte',
      'segund[ao] parte',
      'parcial\\w*',
      'divid\\w*',
      'el resto (?:despues|manana|luego|mas tarde)',
      'lo demas (?:despues|manana|luego)',
      'primero (?:la|el|lo) ',
      '(?:la )?otra parte',
      '(?:una )?primera version',
      'borrador',
      'aunque (?:sea|no este)',
      'la siguiente parte',
      'el resto',
      'lo demas',
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
      'te parece bien',
      'me parece (?:bien|perfecto|buena idea|excelente)',
      'asi (?:le hacemos|lo hacemos|lo dejamos|quedamos)',
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
    // Short yes-words only count at the start ("si no lo tengo…" is a condition, "se va a caer" is not a yes).
    patterns: rx('^(?:si(?=$|,|\\.| (?:claro|perfecto|va|me|de acuerdo|gracias|esta bien|sale|dale|ok|por supuesto))|claro|va|ok|okay|sale|listo|vale|dale)', 'perfecto', 'excelente', 'me sirve', 'me funciona', 'de acuerdo', 'genial'),
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
      'que poca (?:seriedad|verguenza|responsabilidad|madre)',
      'ya te lo habia (?:pedido|dicho)',
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
    // Only words in the same clause negate ("si no llega, se nos cae" is not negated).
    const clause = plain.slice(0, m.index).split(/[,.;:!?¿¡]/).pop() ?? '';
    const before = clause.trim().split(' ').slice(-2);
    if (!before.some((w) => NEGATORS.has(w))) return true;
  }
  return false;
}

const GENERIC =
  /^(?:la |el |los |las |esa |ese |esos |esas |tu |tus )?(?:informacion|info|datos|cosas?|eso|esto|archivo|documento|parte|otra|otro|resto|demas)$/;

/** Extracted from the original text (case-insensitive), so names keep their capitals and accents. */
const DELIVERABLE =
  /(?:necesito|ocupo|me falta|me hace falta|requiero|env[ií]a(?:me|r(?:me)?)?|manda(?:me|r(?:me)?)?|m[aá]ndame|pasa(?:me|r(?:me)?)?|p[aá]same|entrega(?:me|r(?:me)?)?|entr[eé]game|compart(?:e|ir)(?:me)?|mandes|env[ií]es|pases)(?:\s+(?:hoy|manana|mañana|ya|ahorita))?\s+((?:los|las|el|la|esos|esas|ese|esa|tus|tu)\s+\p{L}+(?:\s+(?:de|del|para)\s+(?:la\s+|el\s+|los\s+|las\s+)?\p{L}+)?)/iu;

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
    `antes de que (?:acabe|termine|se acabe|se termine) (?:el día|el dia|la jornada|el turno)`,
    `antes del? (?:lunes|martes|miércoles|miercoles|jueves|viernes|cierre|mediodía|mediodia)`,
    `para el (?:lunes|martes|miércoles|miercoles|jueves|viernes)`,
    `la (?:próxima|proxima|otra) semana`,
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

  const asks = /[?¿]/.test(text);
  for (const [id, fam] of Object.entries({ ...FAMILIES, ...extra })) {
    if (fam.requiresQuestion && !asks) continue;
    if (positiveMatch(plain, fam.patterns, fam.negatable)) signals[id] = 1;
  }

  // "Entiendo" negated means confusion, not empathy.
  if (/\bno (?:entiendo|comprendo|se que)\b/.test(plain)) signals.vague = 1;

  const deliverableMatch = text.match(DELIVERABLE);
  let deliverable: string | undefined;
  if (deliverableMatch) {
    deliverable = deliverableMatch[1].trim();
    // Keep short labels that follow: "la sección A y B".
    const after = text.slice((deliverableMatch.index ?? 0) + deliverableMatch[0].length);
    const labels = after.match(/^\s+([A-Z0-9]{1,3}(?:\s*(?:y|,)\s*[A-Z0-9]{1,3})*)(?=[\s.,;:!?]|$)/);
    if (labels) deliverable += ` ${labels[1]}`;
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
  // A bare "ok" says nothing by itself; the engine drops "vague" when it answers an offer.
  if (signals.affirm && words <= 2 && !hasSubstance) signals.vague = 1;

  return { signals, deliverable, deadline, partial, partialWhen, times, words };
}
