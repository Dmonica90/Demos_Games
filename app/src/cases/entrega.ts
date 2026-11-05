import type { CaseDef } from './types';

export const entrega: CaseDef = {
  id: 'entrega',
  number: 1,
  title: 'La entrega pendiente',
  relation: 'Comunicación entre compañeros',
  context:
    'Un compañero no ha entregado información que necesitas para avanzar con un proyecto. La fecha límite se acerca y necesitas resolver la situación sin generar un conflicto.',
  goal: 'Comunicar el impacto del retraso, comprender qué está pasando y conseguir un compromiso concreto.',
  partner: { name: 'Daniel', role: 'Compañero de proyecto', initials: 'DA' },
  opening: 'No he podido terminar la información que me pediste. Se me juntaron otras cosas y no creo tenerla lista hoy.',
  maxTurns: 5,
  durationS: 480,
  categorize: (s) => {
    if (s.has('hostile') || s.has('blame') || s.has('label') || s.has('shouting')) return 'escalate';
    if (s.has('pressure') && !s.has('empathy')) return 'escalate';
    const substance = s.has('context') || s.has('proposal') || s.has('concrete') || s.has('question');
    if (!substance || s.has('short')) return 'unclear';
    if (s.has('vague') && !s.has('context') && !s.has('concrete')) return 'unclear';
    return 'effective';
  },
  pieces: [
    {
      id: 'listen',
      label: 'Comprender qué pasa',
      from: ['empathy', 'question', 'listen'],
      ask: [
        'Ok… aunque siento que solo te importa la entrega y no lo que me está pasando.',
        'Sí, pero no me has preguntado por qué me atrasé.',
      ],
    },
    {
      id: 'plan',
      label: 'Qué se entrega',
      from: ['proposal', 'commitment', 'priority'],
      ask: [
        'Va, pero no sé por dónde empezar con todo lo que tengo. ¿Qué parte te urge más?',
        '¿Te sirve algo aunque no esté completo, o lo necesitas todo junto?',
      ],
    },
    {
      id: 'date',
      label: 'Para cuándo',
      from: ['concrete'],
      ask: [
        'Ok, ¿y para cuándo la necesitarías como mínimo? Así me organizo.',
        'Me late, pero ponme una hora o un día para que no se me vuelva a pasar.',
      ],
    },
  ],
  relevant: [
    'empathy',
    'context',
    'question',
    'proposal',
    'concrete',
    'commitment',
    'assertive',
    'blame',
    'pressure',
    'hostile',
    'shouting',
    'vague',
    'short',
  ],
  replies: {
    escalate: [
      'Oye, tampoco es que no haya hecho nada. Tengo mil cosas encima, no me hables así.',
      'Mira, si lo vas a tomar así, mejor lo vemos con el líder. Yo no puedo con todo.',
      'Ya no sé qué quieres que te diga. Cuando pueda te lo mando.',
    ],
    unclear: [
      'Ok… ¿entonces qué hago? No me queda claro qué necesitas o para cuándo.',
      'No entiendo bien, ¿es urgente o puede esperar?',
    ],
    unclearInDialog: [
      'Perdón, no te entendí. ¿Qué es exactamente lo que necesitas de mí?',
      'Mmm, no me queda claro qué acordamos.',
    ],
    open: [
      'Gracias por entender. Me pasaron un tema urgente de un cliente y no he podido avanzar con lo tuyo. ¿Cómo lo resolvemos?',
    ],
    openAfterFriction: [
      'Ok, así me queda más claro. Perdón por el retraso: me cayó un tema urgente de un cliente. ¿Qué podemos hacer?',
    ],
    agreement: [
      '¡Perfecto! Queda claro: te lo mando como acordamos. Gracias por la paciencia.',
      'Va, te lo mando como quedamos. Gracias por aterrizarlo.',
    ],
    bySignal: {
      hostile: 'Wow. No tienes por qué insultarme. Así no voy a poder ayudarte.',
    },
    noAgreement: [
      'Bueno, déjame ver qué puedo hacer y te aviso. (La conversación terminó sin un compromiso concreto).',
    ],
  },
  observe: [
    '¿Explica por qué necesita la información?',
    '¿Reconoce la situación del compañero sin dejar de comunicar la urgencia?',
    '¿Evita acusaciones o suposiciones?',
    '¿Propone una fecha o alternativa concreta?',
  ],
  lessons: [
    'Explicar el impacto ("dependo de esto para…") convierte un reclamo en una necesidad compartida.',
    'Preguntar qué pasó antes de exigir abre la conversación en lugar de cerrarla.',
    'Un acuerdo no existe hasta que tiene qué, quién y para cuándo.',
  ],
};
