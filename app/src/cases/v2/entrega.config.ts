import type { V2CaseConfig } from '../../engine/v2/config';

/**
 * Caso 1 · La entrega pendiente — on the memory engine.
 *
 * Daniel wants to help but is saturated, has other priorities and does not
 * want to hand over something incomplete. He answers to everything said so
 * far: what he understood, what is still open, and how the talk made him feel.
 */
export const entregaConfig: V2CaseConfig = {
  maxTurns: 3,
  character: { stress: 70, trust: 60, defensiveness: 20, willingness: 70 },
  stall: [
    { id: 'stall-1', text: 'Ok… dime qué necesitas y veo cómo me organizo.' },
    { id: 'stall-2', text: 'Mmm, sigo sin tener claro cómo quieres que lo resolvamos.' },
  ],
  concrete: [{ signal: 'request', minStrength: 1 }, { signal: 'deadline' }, { signal: 'partial' }],
  flags: [
    { id: 'urgency_explained', label: 'Urgencia explicada', from: ['urgency'] },
    { id: 'impact_explained', label: 'Impacto explicado', from: ['impact'] },
    { id: 'empathy_shown', label: 'Mostró empatía', from: ['empathy'], needsGoodwill: true },
    { id: 'request_clarity', label: 'Pidió algo concreto', from: ['request'], minStrength: 1 },
    { id: 'partial_delivery_proposed', label: 'Entrega parcial', from: ['partial'] },
    { id: 'deadline_defined', label: 'Fecha definida', from: ['deadline'] },
    { id: 'responsibility_confirmed', label: 'Responsable claro', from: ['responsibility'] },
    { id: 'agreement_reached', label: 'Acuerdo', from: [] },
  ],
  stages: [
    { id: 'need_clarified', flag: 'request_clarity' },
    { id: 'partial_offer', flag: 'partial_delivery_proposed' },
    { id: 'timeline_proposed', flag: 'deadline_defined' },
    { id: 'agreement', flag: 'agreement_reached' },
  ],
  escalating: [{ signal: 'hostile' }, { signal: 'blame' }, { signal: 'pressure', unless: ['empathy'] }],
  moodRules: [
    { signal: 'empathy', delta: { trust: 10, defensiveness: -10, stress: -5 } },
    { signal: 'gratitude', delta: { trust: 4 } },
    { signal: 'impact', delta: { willingness: 10 } },
    { signal: 'urgency', unless: ['impact'], delta: { stress: 5 } },
    { signal: 'request', minStrength: 1, delta: { willingness: 5 } },
    { signal: 'partial', delta: { stress: -10, willingness: 8 } },
    { signal: 'vague', delta: { stress: 5 } },
    { signal: 'pressure', delta: { defensiveness: 20, trust: -10, stress: 10 } },
    { signal: 'blame', delta: { defensiveness: 25, trust: -15, willingness: -10 } },
    { signal: 'hostile', delta: { defensiveness: 40, trust: -30, willingness: -25 } },
    { signal: 'shouting', delta: { defensiveness: 10 } },
  ],
  uncapped: ['hostile'],
  reactionOrder: [
    { reaction: 'hostile', signal: 'hostile' },
    { reaction: 'blame', signal: 'blame' },
    { reaction: 'pressure', signal: 'pressure', unless: ['empathy'] },
    { reaction: 'accept', accepted: true },
    { reaction: 'partial', newFlag: 'partial_delivery_proposed' },
    { reaction: 'impact', newFlag: 'impact_explained' },
    { reaction: 'empathy', newFlag: 'empathy_shown' },
    { reaction: 'urgency', newFlag: 'urgency_explained' },
    { reaction: 'request', newFlag: 'request_clarity' },
    { reaction: 'deadline', newFlag: 'deadline_defined' },
  ],
  brokenReaction: 'blame',
  planReady: (f) => f.deadline_defined && (f.partial_delivery_proposed || f.request_clarity),
  closers: ['agreement'],
  agreementFlag: 'agreement_reached',
  lastClosing: (f) => (f.deadline_defined || f.partial_delivery_proposed ? 'last_adjustment' : 'cannot_commit'),
  slotDefaults: {
    deliverable: 'la información',
    deadline: 'mañana',
    partial: 'lo que ya tengo revisado',
    partialWhen: 'hoy',
  },
  needs: [
    {
      id: 'why',
      met: (f) => f.urgency_explained || f.impact_explained,
      ask: [
        { id: 'why-1', text: '¿Es para hoy sí o sí, o tengo un poco de margen?' },
        { id: 'why-2', text: 'Para organizarme: ¿qué pasa si te llega un poco más tarde?' },
      ],
    },
    {
      id: 'what',
      met: (f) => f.request_clarity,
      ask: [
        { id: 'what-1', text: '¿Qué parte necesitas exactamente para poder avanzar?' },
        { id: 'what-2', text: 'Para no mandarte de más: ¿cuál es la sección que te está frenando?' },
      ],
    },
    {
      id: 'partial',
      met: (f) => f.partial_delivery_proposed,
      offer: {
        id: 'partial',
        when: (c) => c.willingness >= 75 && c.defensiveness < 50,
        sets: ['partial_delivery_proposed'],
        lines: [
          {
            id: 'offer-partial-1',
            text: 'Lo que sí podría es mandarte hoy lo que ya tengo revisado de {deliverable} y completar el resto después. ¿Te sirve así?',
          },
        ],
      },
      ask: [
        { id: 'partial-1', text: '¿Te sirve que te mande primero una parte, o lo necesitas todo junto?' },
        { id: 'partial-2', text: 'Si te paso hoy lo que ya está revisado, ¿con eso puedes avanzar?' },
      ],
    },
    {
      id: 'when',
      met: (f) => f.deadline_defined,
      offer: {
        id: 'deadline',
        when: (c) => c.willingness >= 70 && c.defensiveness < 50,
        sets: ['deadline_defined'],
        fills: { deadline: 'mañana a mediodía' },
        lines: [{ id: 'offer-when-1', text: 'El resto lo podría tener mañana a mediodía. ¿Te funciona?' }],
      },
      ask: [
        { id: 'when-1', text: '¿Para cuándo necesitarías el resto, como límite?' },
        { id: 'when-2', text: 'Dame una hora límite y me organizo para cumplirla.' },
      ],
    },
    {
      id: 'confirm',
      met: (f) => f.agreement_reached,
      confirm: { id: 'confirm', sets: ['agreement_reached', 'responsibility_confirmed'] },
      ask: [
        { id: 'confirm-1', text: 'Entonces quedamos así: te mando {partial} {partialWhen} y el resto {deadline}. ¿Va?' },
        { id: 'confirm-2', text: 'Solo para confirmar: ¿te late que quede así, con el resto {deadline}?' },
      ],
    },
  ],
  reactions: {
    empathy: {
      normal: [
        { id: 'emp-1', text: 'Gracias por entenderlo. La verdad es que se me juntaron varias entregas.' },
        { id: 'emp-2', text: 'Sí, estoy intentando sacar todo, pero no quiero enviarte algo que todavía no esté revisado.' },
        { id: 'emp-3', text: 'Te agradezco que lo consideres. Estoy tratando de encontrar cómo avanzar con esto.' },
      ],
      guarded: [
        { id: 'emp-g1', text: 'Ok… te agradezco que lo digas.' },
        { id: 'emp-g2', text: 'Bueno, gracias. Sigo con mucha carga, eso sí.' },
      ],
    },
    impact: {
      normal: [
        { id: 'imp-1', text: 'No había dimensionado que eso te bloqueara para terminar el proyecto.' },
        { id: 'imp-2', text: 'Entiendo. Pensé que todavía tenías margen para trabajar con los otros datos.' },
        { id: 'imp-3', text: 'Ahora veo por qué lo necesitas antes. Déjame revisar qué puedo adelantar.' },
      ],
      guarded: [
        { id: 'imp-g1', text: 'Ok, ya entendí que te frena.' },
        { id: 'imp-g2', text: 'Sí, ya sé que lo necesitas.' },
      ],
    },
    urgency: {
      normal: [
        { id: 'urg-1', text: 'Ok, entiendo que corre prisa.' },
        { id: 'urg-2', text: 'Va, ya vi que la fecha está encima.' },
      ],
      guarded: [{ id: 'urg-g1', text: 'Sí, ya sé que es urgente.' }],
    },
    partial: {
      normal: [
        { id: 'par-2', text: 'Sí, eso podría funcionar. Te envío primero la parte que ya está revisada.' },
        { id: 'par-1', text: 'Puedo compartirte el avance que ya tengo, pero hay algunos datos que todavía debo validar.' },
        {
          id: 'par-3',
          text: 'Podría mandarte una versión preliminar, aunque tendría que señalar qué información sigue pendiente.',
        },
      ],
      guarded: [
        { id: 'par-g1', text: 'Podría mandarte una parte, pero no quiero que luego me reclames lo que falte.' },
      ],
    },
    request: {
      normal: [
        { id: 'req-1', text: 'Ok, {deliverable}. Esa parte la tengo bastante avanzada.' },
        { id: 'req-2', text: 'Va, {deliverable}; eso sí lo tengo casi listo.' },
      ],
      guarded: [{ id: 'req-g1', text: 'Ok, {deliverable}.' }],
    },
    deadline: {
      normal: [
        { id: 'dl-1', text: '{deadline} me queda bien.' },
        { id: 'dl-2', text: 'Ok, {deadline} sí lo veo posible.' },
      ],
      guarded: [{ id: 'dl-g1', text: '{deadline}… lo intento.' }],
    },
    accept: {
      normal: [
        { id: 'acc-1', text: 'Perfecto.' },
        { id: 'acc-2', text: 'Va, así lo hacemos.' },
      ],
      guarded: [{ id: 'acc-g1', text: 'Ok.' }],
    },
    pressure: {
      normal: [
        { id: 'pre-1', text: 'Sé que lo necesitas, pero también tengo otras entregas que debo resolver.' },
        { id: 'pre-2', text: 'Estoy intentando resolverlo. No ayuda que me lo plantees de esa manera.' },
      ],
      guarded: [
        { id: 'pre-g1', text: 'Así, con presión, no me ayudas a sacarlo más rápido.' },
        { id: 'pre-g2', text: 'Ya te dije que estoy en eso.' },
      ],
    },
    blame: {
      normal: [
        { id: 'bla-1', text: 'No creo que sea justo que todo el retraso recaiga sobre mí.' },
        { id: 'bla-2', text: 'Estoy intentando resolverlo. No ayuda que me lo plantees de esa manera.' },
      ],
      guarded: [
        { id: 'bla-g1', text: 'Oye, tampoco es que no haya hecho nada.' },
        { id: 'bla-g2', text: 'Si lo vas a ver así, no sé qué más decirte.' },
      ],
    },
    hostile: {
      normal: [{ id: 'hos-1', text: 'No tienes por qué hablarme así. Así no voy a poder ayudarte.' }],
      guarded: [
        { id: 'hos-g1', text: 'No tienes por qué hablarme así.' },
        { id: 'hos-g2', text: 'Mejor lo platicamos con el líder.' },
      ],
    },
  },
  closings: {
    agreement: {
      normal: [
        { id: 'end-ok-1', text: 'Listo: te mando {partial} {partialWhen} y el resto {deadline}. Gracias por ayudarme a aterrizarlo.' },
      ],
      guarded: [{ id: 'end-ok-g1', text: 'Ok, quedamos así: {partial} {partialWhen} y el resto {deadline}. Lo cumplo.' }],
    },
    last_adjustment: {
      normal: [
        {
          id: 'end-adj-1',
          text: 'Hagamos esto: te mando lo que tengo hoy y mañana temprano te confirmo cuándo tengo el resto.',
        },
      ],
      guarded: [{ id: 'end-adj-g1', text: 'Te mando lo que pueda hoy y luego vemos lo demás.' }],
    },
    cannot_commit: {
      normal: [{ id: 'end-no-1', text: 'Déjame ver cómo me organizo y te aviso. Ahorita no te puedo prometer una fecha.' }],
      guarded: [{ id: 'end-no-g1', text: 'Ahorita no te puedo prometer nada. Te aviso.' }],
    },
    deteriorated: {
      normal: [{ id: 'end-bad-1', text: 'Mira, así no podemos seguir. Mejor lo vemos con el líder.' }],
      guarded: [{ id: 'end-bad-g1', text: 'Mira, así no podemos seguir. Mejor lo vemos con el líder.' }],
    },
  },
};
