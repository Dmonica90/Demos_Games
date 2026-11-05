import { isShouting, normalize, wordCount, words } from './text';

/**
 * What a message does, detected from its words. Positive signals build the
 * conversation; negative ones damage it. Some only matter in one case (a
 * "no puedo" is the failure of case 2), but they are detected everywhere so the
 * analysis is the same code for all three.
 */
export type SignalId =
  // Positive
  | 'empathy'
  | 'context'
  | 'question'
  | 'proposal'
  | 'concrete'
  | 'commitment'
  | 'assertive'
  | 'capacity'
  | 'priority'
  | 'facts'
  | 'listen'
  | 'support'
  | 'followup'
  // Positive, from the memory engine (v2)
  | 'urgency'
  | 'impact'
  | 'request'
  | 'partial'
  | 'deadline'
  | 'agreement'
  | 'responsibility'
  | 'affirm'
  | 'gratitude'
  // Negative
  | 'blame'
  | 'pressure'
  | 'hostile'
  | 'shouting'
  | 'vague'
  | 'short'
  | 'reject'
  | 'blindAccept'
  | 'avoid'
  | 'label';

export const POSITIVE: SignalId[] = [
  'empathy',
  'context',
  'question',
  'proposal',
  'concrete',
  'commitment',
  'assertive',
  'capacity',
  'priority',
  'facts',
  'listen',
  'support',
  'followup',
  'urgency',
  'impact',
  'request',
  'partial',
  'deadline',
  'agreement',
  'responsibility',
  'affirm',
  'gratitude',
];

export const NEGATIVE: SignalId[] = [
  'blame',
  'pressure',
  'hostile',
  'shouting',
  'vague',
  'short',
  'reject',
  'blindAccept',
  'avoid',
  'label',
];

/** How each signal is named in the dashboard and the feedback. */
export const SIGNAL_LABEL: Record<SignalId, string> = {
  empathy: 'Reconoce a la otra persona',
  context: 'Explica el porqué y el impacto',
  question: 'Pregunta y escucha',
  proposal: 'Propone opciones',
  concrete: 'Pone fechas o tiempos concretos',
  commitment: 'Busca confirmar el acuerdo',
  assertive: 'Expresa su necesidad con claridad',
  capacity: 'Expone su carga actual',
  priority: 'Pide definir prioridades',
  facts: 'Describe hechos concretos',
  listen: 'Abre espacio a su perspectiva',
  support: 'Ofrece apoyo',
  followup: 'Define seguimiento',
  urgency: 'Comunica la urgencia',
  impact: 'Explica el impacto',
  request: 'Pide algo concreto',
  partial: 'Propone una entrega parcial',
  deadline: 'Define una fecha u hora',
  agreement: 'Confirma el acuerdo',
  responsibility: 'Aclara quién hace qué',
  affirm: 'Acepta una propuesta',
  gratitude: 'Agradece',
  blame: 'Culpa o reclama',
  pressure: 'Presiona sin escuchar',
  hostile: 'Usa descalificaciones',
  shouting: 'Escribe en mayúsculas (grita)',
  vague: 'Mensaje ambiguo',
  short: 'Mensaje demasiado breve',
  reject: 'Rechaza sin alternativas',
  blindAccept: 'Acepta sin explicar su capacidad',
  avoid: 'Evita nombrar el problema',
  label: 'Etiqueta a la persona',
};

type V2Only = 'urgency' | 'impact' | 'request' | 'partial' | 'deadline' | 'agreement' | 'responsibility' | 'affirm' | 'gratitude';

export const DICTIONARY: Record<Exclude<SignalId, 'shouting' | 'short' | V2Only>, RegExp> = {
  empathy: words(
    'entiendo',
    'comprendo',
    '(?:me )?imagino',
    'se que',
    'lo se',
    'gracias',
    'te agradezco',
    'agradezco',
    'aprecio',
    'valoro',
    'reconozco',
    'lamento',
    'por favor',
    'como estas',
    'como vas',
    'te puedo ayudar',
    'puedo ayudarte',
    'en que te (?:puedo )?ayud\\w*',
    'te apoyo',
    'juntos',
    'es normal',
    'tiene sentido',
    'tu esfuerzo',
    'has (?:hecho|estado)',
  ),
  context: words(
    'porque',
    'ya que',
    'debido a',
    'para poder',
    'para (?:avanzar|terminar|cumplir|entregar|seguir)',
    'necesito (?:la|el|esa|ese|esta|este|tu|tus|los|las)',
    'depend\\w*',
    'impact\\w*',
    'afect\\w*',
    'bloque\\w*',
    'retras\\w*',
    'riesgo\\w*',
    'fecha limite',
    'deadline',
    'cliente\\w*',
    'proyecto',
    'el objetivo',
    'consecuencia\\w*',
    'calidad',
  ),
  question: words(
    'que (?:paso|sucede|ocurre|necesitas|te parece|opinas|piensas|te falta)',
    'como (?:podemos|te puedo|lo ves|vas|te sientes)',
    'hay algo',
    'puedes contarme',
  ),
  proposal: words(
    '(?:te )?propongo',
    'podemos',
    'podriamos',
    'que tal si',
    'te parece si',
    'que te parece',
    'opcion\\w*',
    'alternativa\\w*',
    'avance parcial',
    'una parte',
    'parcial\\w*',
    'lo que (?:ya )?tengas',
    'divid\\w*',
    'sugiero',
    'plan',
    'primero',
  ),
  concrete: words(
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'manana',
    'hoy (?:a las|antes|en la|mismo)',
    'a las \\d+',
    '\\d{1,2}(?::\\d{2})? ?(?:am|pm|hrs?|horas)',
    'medio ?dia',
    'fin del dia',
    'primera hora',
    'antes de (?:las|el|la|que)',
    'a mas tardar',
    'en \\d+ (?:horas|dias|minutos)',
    'esta semana',
    'proxima semana',
    'el \\d{1,2}',
    'fecha',
  ),
  commitment: words(
    'acordamos',
    'quedamos',
    'de acuerdo',
    'te parece bien',
    'me confirmas',
    'confirm\\w*',
    'trato',
    'compromet\\w*',
    'compromiso',
    'cuento contigo',
    'entonces',
  ),
  assertive: words(
    'necesito',
    'requiero',
    'es importante',
    'es clave',
    'me gustaria',
    'quiero',
    'es necesario',
    'me preocupa',
    'es prioritario',
    'esperaria',
    'espero',
  ),
  capacity: words(
    'tengo (?:dos|2|tres|3|otros|otras|varios|varias|pendiente\\w*|en curso)',
    'entregables?',
    'estoy (?:trabajando|con|enfocad\\w*)',
    'carga',
    'capacidad',
    'en curso',
    'pendientes',
    'compromisos',
    'actividades',
    'ocupad\\w*',
    'mi agenda',
    'ya tengo',
  ),
  priority: words(
    'prioridad\\w*',
    'prioriz\\w*',
    'que es mas importante',
    'cual (?:es mas|va|priorizo|prefieres)',
    'que prefieres',
    'que va primero',
    'mover',
    'muevo',
    'ajust\\w*',
    'reprogram\\w*',
    'pospon\\w*',
    'recorr\\w*',
    'delegar',
    'alguien mas',
    'extender',
    'nueva fecha',
  ),
  facts: words(
    'en (?:las|los) ultim\\w*',
    'en el (?:reporte|informe|entregable)',
    '\\d+ (?:errores|veces|entregas|reportes|actividades)',
    'por ejemplo',
    'especificamente',
    'concretamente',
    'revise',
    'detecte',
    'note',
    'observe',
    'he visto',
    'error\\w*',
    'entregas',
    'datos',
  ),
  listen: words(
    'tu perspectiva',
    'tu punto de vista',
    'como lo ves',
    'que ha pasado',
    'que necesitas',
    'cuentame',
    'escuch\\w*',
    'que opinas',
  ),
  support: words(
    'apoy\\w*',
    'ayud\\w*',
    'acompan\\w*',
    'capacit\\w*',
    'revis\\w* juntos',
    'recursos',
    'herramienta\\w*',
    'mentor\\w*',
  ),
  followup: words(
    'seguimiento',
    'revisemos',
    'cada (?:semana|lunes|martes|miercoles|jueves|viernes)',
    'semanal\\w*',
    'reunion\\w*',
    'check',
    '1:1',
    'uno a uno',
    'en (?:dos|2|una|1) semanas?',
    'checklist',
    'lista de verificacion',
  ),
  blame: words(
    'tu culpa',
    'es tu (?:trabajo|responsabilidad|problema|chamba)',
    'otra vez',
    'como siempre',
    'siempre (?:es|haces|llegas|te|lo|igual|lo mismo)',
    'nunca',
    'deberias (?:de )?haber\\w*',
    'no es posible que',
    'no puede ser',
    'excusas?',
    'pretextos?',
    'no es mi problema',
    'me vale',
    'te dije',
    'ya te habia',
    'irresponsab\\w*',
    'que poca',
  ),
  pressure: words(
    'ya mismo',
    'ahora mismo',
    'inmediatamente',
    'de inmediato',
    'como sea',
    'me da igual',
    'no me importa',
    'tienes que',
    'exijo',
    'sin excusas',
    'a fuerza',
    'o si no',
    'lo quiero hoy',
    'lo necesito hoy',
  ),
  hostile: words(
    'inutil\\w*',
    'incompetente\\w*',
    'flojo',
    'floja',
    'mediocre\\w*',
    'tont[oa]s?',
    'estupid\\w*',
    'pesim[oa]',
    'desastre',
    'verguenza',
    'ridicul\\w*',
    'idiota\\w*',
    'harto',
    'harta',
  ),
  vague: words(
    'a ver',
    'ni modo',
    'lo que puedas',
    'cuando puedas',
    'como puedas',
    'no se',
    'ok',
    'okay',
    'esta bien',
    'sale',
    'bueno',
    'luego vemos',
    'ya veremos',
    'despues vemos',
    'ahi vemos',
    'como quieras',
  ),
  reject: words(
    'no puedo',
    'no voy a',
    'no me toca',
    'imposible',
    'no es mi',
    'no tengo tiempo',
    'que lo haga otr[oa]',
    'busca a otr[oa]',
    'ni de chiste',
  ),
  blindAccept: words(
    'si claro',
    'claro que si',
    'sin problema',
    'cuenta con(?:migo)?',
    'lo hago',
    'listo',
    'por supuesto',
    'con gusto',
    'de una',
  ),
  avoid: words(
    'no pasa nada',
    'no te preocupes',
    'olvidalo',
    'no es (?:tan )?importante',
    'dejemoslo',
    'no es para tanto',
    'todo bien',
    'no hay problema',
    'sigue asi',
  ),
  label: words(
    'eres (?:un |una |muy )?(?:descuidad\\w*|irresponsab\\w*|flojo|floja|desorganizad\\w*|lent[oa]|distraid\\w*)',
    'siempre te equivocas',
    'no sirves',
    'descuidad\\w*',
    'no te importa',
  ),
};

/** Every signal present in a message. */
export function detect(text: string): Set<SignalId> {
  const plain = normalize(text);
  const found = new Set<SignalId>();
  for (const [id, pattern] of Object.entries(DICTIONARY) as [SignalId, RegExp][]) {
    if (pattern.test(plain)) found.add(id);
  }
  if (/[?¿]/.test(text)) found.add('question');
  if (found.has('question') && /\b(?:tu|te)\b/.test(plain)) found.add('listen');
  if (isShouting(text) || /!{2,}/.test(text)) found.add('shouting');
  if (wordCount(text) < 6) found.add('short');
  return found;
}
