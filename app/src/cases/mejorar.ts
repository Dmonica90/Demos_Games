import type { CaseDef } from './types';

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
  maxTurns: 6,
  durationS: 540,
  categorize: (s) => {
    if (s.has('hostile') || s.has('blame') || s.has('label') || s.has('shouting')) return 'escalate';
    if (s.has('pressure') && !s.has('empathy')) return 'escalate';
    if (s.has('avoid') && !s.has('facts')) return 'unclear';
    const substance =
      s.has('facts') || s.has('context') || s.has('listen') || s.has('support') || s.has('followup') || s.has('proposal');
    if (!substance || s.has('short')) return 'unclear';
    if (s.has('vague') && !s.has('facts') && !s.has('context')) return 'unclear';
    return 'effective';
  },
  pieces: [
    {
      id: 'facts',
      label: 'Hechos e impacto',
      from: ['facts', 'context'],
      ask: [
        'Está bien, pero ¿qué errores exactamente? Siento que es algo general.',
        '¿Y eso a quién le afecta? Pensé que eran detalles menores.',
      ],
    },
    {
      id: 'listen',
      label: 'Escucha su perspectiva',
      from: ['listen', 'question'],
      ask: [
        'Entiendo lo que dices, pero nadie me ha preguntado cómo estoy con la carga de trabajo.',
        'Siento que esto va en una sola dirección.',
      ],
    },
    {
      id: 'action',
      label: 'Acciones y apoyo',
      from: ['support', 'proposal'],
      ask: [
        'Ok, quiero mejorar, pero ¿qué hago diferente? ¿Cómo me pueden apoyar?',
        'Lo entiendo. ¿Qué propones que cambiemos?',
      ],
    },
    {
      id: 'followup',
      label: 'Seguimiento',
      from: ['followup', 'concrete'],
      ask: [
        'Me parece bien. ¿Y cómo vamos a saber si está funcionando?',
        '¿Cuándo lo revisamos para ver cómo voy?',
      ],
    },
  ],
  relevant: [
    'facts',
    'context',
    'listen',
    'question',
    'empathy',
    'support',
    'proposal',
    'followup',
    'concrete',
    'blame',
    'label',
    'hostile',
    'pressure',
    'shouting',
    'avoid',
    'vague',
    'short',
  ],
  replies: {
    escalate: [
      '¿Ves? Justo esto es lo que digo: solo se fijan en lo malo. Así no dan ganas de nada.',
      'Si piensas eso de mí, no sé para qué seguimos hablando.',
      'Ok. Haré lo que me digan y ya.',
    ],
    unclear: [
      'No sé bien qué esperas de mí, la verdad.',
      '¿Entonces qué es lo que está mal?',
    ],
    unclearInDialog: [
      'Perdón, no me queda claro qué tengo que cambiar.',
      'Ok… pero ¿en concreto qué?',
    ],
    open: [
      'Ok… la verdad es que he tenido mucha carga y reviso todo muy rápido. No sabía que eso estaba afectando al equipo.',
    ],
    openAfterFriction: [
      'Bueno, dicho así lo entiendo mejor. He tenido mucha carga y reviso todo rápido; no me di cuenta del impacto.',
    ],
    agreement: [
      'Me sirve mucho que lo hayamos aterrizado así. Me comprometo con eso y lo revisamos como acordamos. Gracias.',
      'Ok, me comprometo. Gracias por decirlo claro y por el apoyo.',
    ],
    bySignal: {
      label: 'No soy así. Me estás juzgando a mí, no a mi trabajo.',
      avoid: 'Ah, ok… entonces, ¿todo bien? No entiendo para qué era la reunión.',
    },
    noAgreement: [
      'Bueno… intentaré tener más cuidado. (La conversación terminó sin acciones ni seguimiento definidos).',
    ],
  },
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
