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

export const POSITIVE: SignalId[] = (Object.keys(LABELS) as SignalId[]).filter((s) => !NEGATIVE.includes(s));
