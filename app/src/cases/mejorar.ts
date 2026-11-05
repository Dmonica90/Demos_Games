import type { CaseDef } from './types';
import { mejorarConfig } from './v2/mejorar.config';

export const mejorar: CaseDef = {
  id: 'mejorar',
  number: 3,
  title: 'Necesitamos mejorar',
  relation: 'Comunicación con un colaborador',
  context:
    'Una persona de tu equipo ha entregado varias actividades con errores. Necesitas abordar el problema y acordar mejoras sin desmotivar ni evitar la conversación.',
  goal: 'Dar retroalimentación clara, explicar el impacto y establecer compromisos de mejora.',
  partner: { name: 'Luis', role: 'Colaborador de tu equipo', initials: 'LU' },
  opening:
    'No entiendo por qué necesitamos hablar de esto. He estado haciendo todo lo posible y siento que solo se están fijando en mis errores.',
  maxTurns: mejorarConfig.maxTurns,
  durationS: 540,
  v2: mejorarConfig,
  relevant: [
    'facts',
    'impact',
    'impact_extra',
    'listen',
    'empathy',
    'actions',
    'support',
    'followup',
    'deadline',
    'agreement',
    'label',
    'blame',
    'avoid',
    'pressure',
    'hostile',
    'shouting',
    'vague',
    'short',
  ],
  observe: [
    '¿Se enfoca en hechos concretos y no en juicios personales?',
    '¿Explica el impacto de los errores?',
    '¿Escucha la perspectiva del colaborador?',
    '¿Define expectativas y acciones de seguimiento?',
  ],
  lessons: [
    'Describe hechos ("en los últimos tres reportes…"), no a la persona ("eres descuidado").',
    'Evitar el tema para no incomodar deja el problema intacto y a la persona sin saber qué cambiar.',
    'La retroalimentación se convierte en mejora cuando hay acciones, apoyo y una fecha de revisión.',
  ],
};
