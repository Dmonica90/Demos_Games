/**
 * Every signal the analyzer (`engine/v2/analyzer.ts` plus each case's own
 * families) can report, and how the dashboard and the feedback name it.
 */
const LABELS = {
  // Positive
  empathy: 'Reconoce a la otra persona',
  gratitude: 'Agradece',
  urgency: 'Comunica la urgencia',
  impact: 'Explica el impacto',
  impact_extra: 'Explica el impacto',
  request: 'Pide algo concreto',
  partial: 'Propone una entrega parcial',
  deadline: 'Define una fecha u hora',
  agreement: 'Confirma el acuerdo',
  responsibility: 'Aclara quién hace qué',
  affirm: 'Acepta una propuesta',
  question: 'Pregunta y escucha',
  capacity: 'Expone su carga actual',
  risk: 'Explica el riesgo',
  options: 'Propone opciones',
  decision_ask: 'Pide definir prioridades',
  facts: 'Describe hechos concretos',
  listen: 'Abre espacio a su perspectiva',
  support: 'Ofrece apoyo',
  actions: 'Propone acciones concretas',
  followup: 'Define seguimiento',
  // Negative
  blame: 'Culpa o reclama',
  pressure: 'Presiona sin escuchar',
  hostile: 'Usa descalificaciones',
  shouting: 'Escribe en mayúsculas (grita)',
  vague: 'Mensaje ambiguo',
  short: 'Mensaje demasiado breve',
  reject: 'Rechaza sin alternativas',
  blind_accept: 'Acepta sin explicar su capacidad',
  avoid: 'Evita nombrar el problema',
  label: 'Etiqueta a la persona',
} as const;

export type SignalId = keyof typeof LABELS;

export const SIGNAL_LABEL: Record<SignalId, string> = LABELS;

export const NEGATIVE: SignalId[] = [
  'blame',
  'pressure',
  'hostile',
  'shouting',
  'vague',
  'short',
  'reject',
  'blind_accept',
  'avoid',
  'label',
];

/** What to do instead, for the most common mistake on the results screen. */
export const SIGNAL_TIP: Partial<Record<SignalId, string>> = {
  blame: 'Describe el impacto de lo que pasó en lugar de buscar culpables.',
  pressure: 'Explica por qué es importante y pregunta qué necesita la otra persona.',
  hostile: 'Critica el trabajo, nunca a la persona. Un insulto cierra cualquier conversación.',
  shouting: 'Escribe en minúsculas: las mayúsculas se leen como gritos.',
  vague: 'Di qué necesitas, para cuándo y por qué, en una o dos frases completas.',
  short: 'Un mensaje de una o dos palabras no da contexto: explica y propone.',
  reject: 'En lugar de "no puedo", explica tu carga y propone una alternativa.',
  blind_accept: 'Antes de decir que sí, explica qué tienes en curso y qué se pondría en riesgo.',
  avoid: 'Nombra el problema con hechos concretos; evitarlo no ayuda a la otra persona a mejorar.',
  label: 'Describe hechos ("en los últimos reportes…"), no etiquetes a la persona ("eres descuidado").',
};

export const POSITIVE: SignalId[] = (Object.keys(LABELS) as SignalId[]).filter((s) => !NEGATIVE.includes(s));
