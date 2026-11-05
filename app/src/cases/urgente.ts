import type { CaseDef } from './types';

export const urgente: CaseDef = {
  id: 'urgente',
  number: 2,
  title: 'Todo es urgente',
  relation: 'Comunicación con el líder',
  context:
    'Tu líder te asigna una nueva actividad urgente, pero ya tienes dos entregables prioritarios con fechas próximas.',
  goal: 'Comunicar tu capacidad actual, negociar prioridades y conseguir una decisión clara sin parecer que rechazas el trabajo.',
  partner: { name: 'Mariana', role: 'Tu líder', initials: 'MA' },
  opening: 'Necesito que tomes este nuevo entregable. Es urgente y me gustaría tenerlo listo para mañana.',
  maxTurns: 5,
  durationS: 480,
  categorize: (s) => {
    if (s.has('hostile') || s.has('blame') || s.has('label') || s.has('shouting')) return 'escalate';
    if (s.has('reject') && !s.has('capacity') && !s.has('priority') && !s.has('proposal')) return 'escalate';
    if (s.has('blindAccept') && !s.has('capacity')) return 'unclear';
    const substance = s.has('capacity') || s.has('priority') || s.has('proposal') || s.has('context');
    if (!substance || s.has('short')) return 'unclear';
    if (s.has('vague') && !s.has('capacity') && !s.has('priority')) return 'unclear';
    return 'effective';
  },
  pieces: [
    {
      id: 'capacity',
      label: 'Expone su carga actual',
      from: ['capacity'],
      ask: [
        'Entiendo, pero ¿qué tienes ahorita en curso? Ayúdame a ver tu carga.',
        'Antes de mover nada, cuéntame qué tienes comprometido esta semana.',
      ],
    },
    {
      id: 'priority',
      label: 'Propone qué va primero',
      from: ['priority', 'proposal'],
      ask: [
        'Ok, ya veo tu carga. ¿Qué me propones entonces?',
        'Y si tuvieras que elegir, ¿qué moverías?',
      ],
    },
    {
      id: 'decision',
      label: 'Pide una decisión clara',
      from: ['question', 'commitment', 'concrete'],
      ask: [
        'Suena razonable. ¿Cómo quieres que lo dejemos?',
        'Ok, ¿y qué necesitas que yo decida?',
      ],
    },
  ],
  relevant: [
    'capacity',
    'priority',
    'proposal',
    'context',
    'question',
    'concrete',
    'commitment',
    'assertive',
    'empathy',
    'reject',
    'blindAccept',
    'blame',
    'hostile',
    'shouting',
    'vague',
    'short',
  ],
  replies: {
    escalate: [
      'Vaya… esperaba más disposición. Esto es importante para el área.',
      'Te lo estoy pidiendo porque confío en ti, pero si la respuesta es "no", lo tengo que escalar.',
      'Ok. Lo platicamos después con más calma.',
    ],
    unclear: [
      'Ok… ¿lo puedes tomar o no? No me queda claro.',
      'No te entendí bien. ¿Hay algún problema con el entregable?',
    ],
    unclearInDialog: [
      'Mmm, no te sigo. ¿Qué es lo que me estás proponiendo exactamente?',
      'Ok, pero sigo sin saber qué va primero.',
    ],
    open: [
      'Gracias por decírmelo, no tenía claro que estabas con dos entregables. Veamos prioridades: ¿qué propones?',
    ],
    openAfterFriction: [
      'Ah, ok, ahora entiendo el panorama. No quiero que se nos caiga nada. ¿Qué propones?',
    ],
    agreement: [
      'Me parece bien. Lo dejamos así: queda claro qué va primero y qué se ajusta. Gracias por avisarme a tiempo.',
      'De acuerdo, lo dejamos así. Gracias por plantearlo con claridad.',
    ],
    bySignal: {
      blindAccept: '¡Perfecto, gracias! Entonces cuento con eso para mañana, junto con lo demás.',
      reject: '¿Cómo que no? Necesito que alguien lo saque y pensé en ti.',
    },
    noAgreement: [
      'Bueno, intenta sacar todo y me avisas cómo vas. (Se acumularon los compromisos sin una prioridad clara).',
    ],
  },
  observe: [
    '¿Explica qué actividades tiene en curso?',
    '¿Comunica los riesgos de asumir otra tarea sin negociar?',
    '¿Evita responder simplemente que no puede?',
    '¿Propone opciones y solicita una definición de prioridades?',
  ],
  lessons: [
    'Decir "sí" sin hablar de tu capacidad no es disposición: es un riesgo que descubrirán después.',
    'Un "no puedo" sin alternativas se escucha como falta de compromiso; "puedo si…" abre la negociación.',
    'Tu líder decide prioridades, pero solo puede hacerlo si le muestras el panorama completo.',
  ],
};
