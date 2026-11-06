import { family } from '../../engine/v2/analyzer';
import type { V2CaseConfig } from '../../engine/v2/config';

/**
 * Caso 2 · Todo es urgente — on the memory engine.
 *
 * Mariana, the leader, is under pressure from her own boss. She values
 * willingness, dislikes a flat "no", and decides well once she sees the whole
 * picture: what is already in progress, what is at risk, and the options.
 */
export const urgenteConfig: V2CaseConfig = {
  maxTurns: 3,
  character: { stress: 75, trust: 65, defensiveness: 15, willingness: 55 },
  families: {
    capacity: family(
      true,
      'tengo (?:dos|2|tres|3|otros|otras|varios|varias) (?:entregables|pendientes|proyectos|actividades|cosas|entregas)',
      'ya tengo',
      'estoy (?:con|trabajando en|cerrando|terminando|enfocad\\w*)',
      'mis (?:entregables|pendientes|prioridades)',
      'entregables? (?:prioritari\\w*|pendientes?|en curso|comprometid\\w*)',
      'mi (?:carga|capacidad|agenda)',
      'en curso',
      'esta semana (?:entrego|tengo|cierro)',
      'tengo que entregar',
      'comprometid\\w* para',
      'tengo (?:una|la|las|los|otra|otras|otro|otros) (?:entrega|entregas|presentacion|presentaciones|evaluacion|evaluaciones|reporte\\w*|proyecto\\w*)',
      'tengo que (?:hacer|terminar|mandar|preparar|cerrar|trabajar)',
      'otros entregables',
      'entregables pendientes',
      'tambien (?:tengo|estoy)',
      'trabajar (?:tambien )?(?:en )?otros',
      'tengo encima',
      '(?:estoy|ando) (?:saturad\\w*|a tope|hasta el tope|llen\\w*)',
      'traigo (?:mucha |mucho )?(?:carga|chamba|trabajo|pendientes)',
      '(?:mucha|mucho) (?:carga|chamba|trabajo)',
      'tengo (?:muchos |varios )?pendientes',
      'me comprometi',
    ),
    risk: family(
      false,
      'riesgo\\w*',
      'arriesg\\w*',
      'no (?:llegaria|alcanzaria|me daria tiempo|saldria|me alcanza)',
      'se (?:retrasaria|atrasaria|caeria|afectaria)',
      '(?:bajaria|sacrificar\\w*|afectar\\w*) la calidad',
      'quedar mal',
      'algo se (?:va a|podria) (?:caer|retrasar)',
      'no podria (?:con todo|cumplir)',
      'se (?:retrase|atrase|caiga|afecte)',
      'me preocupa',
      'a medias',
      '(?:bajar|baje|bajaria) la calidad',
      'no quiero entregar(?:te)? (?:algo )?(?:mal|incompleto)',
      'comprometer (?:la|las|los|el)',
    ),
    options: family(
      true,
      '(?:te )?propongo',
      'podria(?:mos)? (?:mover|recorrer|pasar|posponer|delegar|dividir|entregar)',
      'mover (?:el|la|uno|una|lo)',
      'mover(?:lo|la|los|las)',
      'pedir(?:le)? (?:apoyo|ayuda)',
      '(?:apoyo|ayuda) (?:a|de) alguien',
      'recorr\\w*',
      'pospon\\w*',
      'reprogram\\w*',
      'delegar',
      'apoyo de',
      'alguien (?:mas|del equipo) (?:me )?(?:apoye|ayude|lo tome|lo haga conmigo)',
      'si me das (?:hasta|chance|tiempo|un dia)',
      'me das hasta',
      'que tal si',
      'por fases',
      'por partes',
      'en (?:dos|2|tres|3) partes',
      '(?:una )?primera version',
      'version (?:inicial|preliminar)',
      'recortar',
      '(?:reducir|ajustar) el alcance',
      'nueva fecha',
      'otra opcion',
      'opciones',
      'si muevo',
      'que te parece (?:esto|si)',
      'lo termino (?:hoy|primero|manana)',
      'primero (?:termino|hago|saco|entrego)',
      '(?:manana|despues|luego) (?:sigo|continuo|puedo seguir|retomo)',
      'puedo (?:terminarlo|hacerlo|entregarlo|sacarlo) (?:hoy|primero|manana)',
    ),
    // Says which piece goes first and what waits: "lo nuevo va primero y el reporte lo muevo al lunes".
    priority: family(
      true,
      'lo (?:nuevo|nueva|urgente|esto|eso) (?:va|vamos a hacer|lo hago|lo entrego|lo saco) primero',
      'primero (?:lo|la|el) (?:nuevo|nueva|urgente|esto|eso)',
      'primero (?:esto|eso)',
      'lo (?:demas|resto) (?:lo |se )?(?:ajust\\w*|despues|luego|manana|acomod\\w*)',
      'el (?:reporte|resto|otro|otra|mensual|pendiente) (?:lo |la )?(?:muevo|paso|ajusto|dejo|recorro|pospongo)',
      'primero (?:lo|la|el) (?:que urge|que es urgente|de hoy)',
    ),
    decision_ask: family(
      true,
      'que (?:prefieres|priorizo|va primero|es mas importante|muevo|dejo para despues)',
      'cual (?:priorizo|va primero|prefieres|es mas importante|es la prioridad)',
      '(?:es )?mas (?:urgente|importante|prioritario) para ti',
      'me ayudas a priorizar',
      'priorizar',
      'prioridad\\w*',
      'que necesitas primero',
    ),
    reject: family(
      false,
      'no puedo',
      'no voy a',
      'no me toca',
      'imposible',
      'no tengo tiempo',
      'que lo haga otr[oa]',
      'busca(?:le)? a (?:otr[oa]|alguien)',
      'no es mi',
      'no me corresponde',
    ),
    blind_accept: family(
      false,
      'si claro',
      'claro que si',
      'sin problema',
      'cuenta con(?:migo)?',
      'lo hago',
      'yo lo saco',
      'por supuesto',
      'con gusto',
      'de una',
      'dalo por hecho',
    ),
  },
  suppress: [
    { signal: 'blind_accept', when: ['capacity', 'options', 'risk', 'decision_ask'] },
    // "No puedo, estoy lleno" is still a no without alternatives; only a proposal cancels it.
    { signal: 'reject', when: ['options'] },
  ],
  quietReactions: ['blind_accept'],
  acknowledge: [
    { id: 'ack-1', text: 'Ok, te escucho.' },
    { id: 'ack-2', text: 'Va, entiendo.' },
  ],
  stall: [
    { id: 'stall-1', text: 'Mmm, sigo sin saber cómo vas a sacar todo.' },
    { id: 'stall-2', text: 'Ayúdame: necesito una respuesta clara para avanzar.' },
  ],
  concrete: [
    { signal: 'capacity' },
    { signal: 'risk' },
    { signal: 'options' },
    { signal: 'decision_ask' },
    { signal: 'deadline' },
    { signal: 'request', minStrength: 1 },
  ],
  aliases: {
    capacity: 'impact',
    risk: 'urgency',
    options: 'partial',
    decision_ask: 'responsibility',
    reject: 'pressure',
    blind_accept: 'vague',
  },
  flags: [
    { id: 'capacity_explained', label: 'Explicó su carga', from: ['capacity'] },
    { id: 'risk_explained', label: 'Explicó el riesgo', from: ['risk'] },
    { id: 'options_proposed', label: 'Propuso opciones', from: ['options'] },
    { id: 'priority_requested', label: 'Pidió priorizar', from: ['decision_ask'] },
    { id: 'empathy_shown', label: 'Reconoció la urgencia', from: ['empathy'], needsGoodwill: true },
    { id: 'priority_decided', label: 'Prioridad decidida', from: ['priority'] },
    { id: 'deadline_defined', label: 'Fecha definida', from: ['deadline'], unless: ['capacity'] },
    { id: 'overcommitted', label: 'Aceptó sin explicar', from: ['blind_accept'], unless: ['capacity', 'options', 'risk'] },
    { id: 'agreement_reached', label: 'Acuerdo', from: [] },
  ],
  stages: [
    { id: 'capacity_shared', flag: 'capacity_explained' },
    { id: 'options_on_table', flag: 'options_proposed' },
    { id: 'priority_set', flag: 'priority_decided' },
    { id: 'agreement', flag: 'agreement_reached' },
  ],
  escalating: [
    { signal: 'hostile' },
    { signal: 'blame' },
    { signal: 'reject', unless: ['capacity', 'options', 'risk'] },
    { signal: 'pressure', unless: ['empathy'] },
  ],
  unclear: ['blind_accept'],
  moodRules: [
    { signal: 'empathy', delta: { trust: 8, defensiveness: -8 } },
    { signal: 'gratitude', delta: { trust: 3 } },
    { signal: 'capacity', delta: { willingness: 10, stress: 5 } },
    { signal: 'risk', delta: { willingness: 10 } },
    { signal: 'options', delta: { willingness: 12, stress: -10, trust: 5 } },
    { signal: 'decision_ask', delta: { trust: 5, willingness: 5 } },
    { signal: 'priority', delta: { willingness: 10, trust: 5 } },
    { signal: 'blind_accept', unless: ['capacity', 'options', 'risk'], delta: { stress: -15, trust: 5 } },
    { signal: 'reject', unless: ['capacity', 'options', 'risk'], delta: { defensiveness: 25, trust: -15, willingness: -10 } },
    { signal: 'vague', delta: { stress: 5 } },
    { signal: 'pressure', delta: { defensiveness: 20, trust: -10 } },
    { signal: 'blame', delta: { defensiveness: 25, trust: -15, willingness: -10 } },
    { signal: 'hostile', delta: { defensiveness: 40, trust: -30, willingness: -25 } },
    { signal: 'shouting', delta: { defensiveness: 10 } },
  ],
  uncapped: ['hostile'],
  reactionOrder: [
    { reaction: 'hostile', signal: 'hostile' },
    { reaction: 'blame', signal: 'blame' },
    { reaction: 'reject', signal: 'reject', unless: ['capacity', 'options', 'risk'] },
    { reaction: 'pressure', signal: 'pressure', unless: ['empathy'] },
    { reaction: 'blind_accept', signal: 'blind_accept', unless: ['capacity', 'options', 'risk'] },
    { reaction: 'accept', accepted: true },
    // What the person proposes comes first: Mariana answers the proposal.
    { reaction: 'options', newFlag: 'options_proposed' },
    { reaction: 'capacity', newFlag: 'capacity_explained' },
    { reaction: 'risk', newFlag: 'risk_explained' },
    { reaction: 'priority', newFlag: 'priority_requested' },
    { reaction: 'empathy', newFlag: 'empathy_shown' },
    { reaction: 'deadline', newFlag: 'deadline_defined' },
  ],
  brokenReaction: 'reject',
  planReady: (f) => f.priority_decided && f.deadline_defined,
  closers: ['agreement'],
  agreementFlag: 'agreement_reached',
  lastClosing: (f) =>
    f.options_proposed || f.priority_decided ? 'last_adjustment' : f.overcommitted ? 'overcommitted' : 'cannot_commit',
  slotDefaults: { deliverable: 'el entregable', deadline: 'mañana', partial: 'una primera versión', partialWhen: 'hoy' },
  needs: [
    {
      id: 'capacity',
      met: (f) => f.capacity_explained,
      ask: [
        { id: 'cap-1', text: 'Ok… ¿qué tienes en curso ahorita? Ayúdame a ver tu carga.' },
        { id: 'cap-2', text: 'Antes de decidir nada: ¿qué tienes comprometido esta semana?' },
      ],
    },
    {
      id: 'risk',
      met: (f) => f.risk_explained || f.options_proposed,
      offer: {
        id: 'move-report-early',
        when: (c) => c.willingness >= 65 && c.defensiveness < 50,
        sets: ['risk_explained', 'options_proposed', 'priority_decided'],
        lines: [
          {
            id: 'offer-move-early-1',
            text: 'No quiero que se te caiga nada. Lo que podría hacer es mover el reporte mensual al lunes para que te enfoques en esto. ¿Te ayuda?',
          },
        ],
      },
      ask: [
        { id: 'risk-1', text: '¿Qué pasa si tomas las tres cosas a la vez?' },
        { id: 'risk-2', text: '¿Qué se pondría en riesgo si te lo paso así?' },
      ],
    },
    {
      id: 'options',
      met: (f) => f.options_proposed,
      offer: {
        id: 'move-report',
        when: (c) => c.willingness >= 65 && c.defensiveness < 50,
        sets: ['options_proposed', 'priority_decided'],
        // Same proposal as the early offer: if she already made it, she does not repeat it.
        lines: [
          {
            id: 'offer-move-early-1',
            text: 'No quiero que se te caiga nada. Lo que podría hacer es mover el reporte mensual al lunes para que te enfoques en esto. ¿Te ayuda?',
          },
        ],
      },
      ask: [
        { id: 'opt-1', text: 'Va. ¿Qué me propones entonces?' },
        { id: 'opt-2', text: 'Si tuvieras que mover algo, ¿qué moverías?' },
      ],
    },
    {
      id: 'priority',
      met: (f) => f.priority_decided,
      offer: {
        id: 'decide',
        when: (c, f) => f.options_proposed && c.willingness >= 45 && c.defensiveness < 60,
        sets: ['priority_decided'],
        lines: [
          { id: 'offer-decide-1', text: 'Ok, decidido: prioriza lo nuevo y lo demás lo ajustamos como propones. ¿Te funciona?' },
        ],
      },
      ask: [
        { id: 'pri-1', text: '¿Qué necesitas que yo decida?' },
        { id: 'pri-2', text: 'Dime qué va primero según tú y lo platicamos.' },
      ],
    },
    {
      id: 'when',
      met: (f) => f.deadline_defined,
      offer: {
        id: 'deadline',
        when: (c) => c.willingness >= 60 && c.defensiveness < 50,
        sets: ['deadline_defined'],
        fills: { deadline: 'mañana a mediodía' },
        lines: [{ id: 'offer-when-1', text: '¿Te late tenerlo mañana a mediodía en lugar de a primera hora?' }],
      },
      ask: [
        { id: 'when-1', text: '¿Para cuándo me lo puedes tener, siendo realista?' },
        { id: 'when-2', text: 'Dame una fecha que sí puedas cumplir.' },
      ],
    },
    {
      id: 'confirm',
      met: (f) => f.agreement_reached,
      confirm: { id: 'confirm', sets: ['agreement_reached'] },
      ask: [
        { id: 'confirm-1', text: 'Entonces quedamos: lo nuevo va primero, lo demás se ajusta como dijimos y me lo entregas {deadline}. ¿Va?' },
        { id: 'confirm-2', text: 'Solo confirmo: ¿te comprometes a tenerlo {deadline}?' },
      ],
    },
  ],
  reactions: {
    capacity: {
      normal: [
        { id: 'r-cap-1', text: 'Ah, no tenía claro que estabas con esos entregables.' },
        { id: 'r-cap-2', text: 'Ok, gracias por ponerme el panorama completo.' },
      ],
      guarded: [{ id: 'r-cap-g1', text: 'Ok, ya vi tu carga.' }],
    },
    risk: {
      normal: [
        { id: 'r-risk-1', text: 'Tienes razón, no quiero que se nos caiga nada.' },
        { id: 'r-risk-2', text: 'Entiendo, no quiero sacrificar la calidad de lo que ya tienes.' },
      ],
      guarded: [{ id: 'r-risk-g1', text: 'Sí, ya entendí el riesgo.' }],
    },
    options: {
      normal: [
        { id: 'r-opt-1', text: 'Me gusta que llegues con una propuesta.' },
        { id: 'r-opt-2', text: 'Eso puede funcionar, déjame pensarlo.' },
      ],
      guarded: [{ id: 'r-opt-g1', text: 'Ok, puede ser.' }],
    },
    priority: {
      normal: [
        { id: 'r-pri-1', text: 'Me ayuda que me lo preguntes así.' },
        { id: 'r-pri-2', text: 'Buena pregunta: no quiero que adivines qué va primero.' },
      ],
      guarded: [{ id: 'r-pri-g1', text: 'Ok, lo decidimos.' }],
    },
    empathy: {
      normal: [
        { id: 'r-emp-1', text: 'Gracias por entender la presión que traigo.' },
        { id: 'r-emp-2', text: 'Sí, me lo están pidiendo desde arriba.' },
      ],
      guarded: [{ id: 'r-emp-g1', text: 'Ok, gracias.' }],
    },
    deadline: {
      normal: [
        { id: 'r-dl-1', text: '{deadline} me funciona.' },
        { id: 'r-dl-2', text: 'Ok, {deadline} está bien.' },
      ],
      guarded: [{ id: 'r-dl-g1', text: '{deadline}… está bien.' }],
    },
    accept: {
      normal: [
        { id: 'r-acc-1', text: 'Perfecto.' },
        { id: 'r-acc-2', text: 'Va, así lo hacemos.' },
      ],
      guarded: [{ id: 'r-acc-g1', text: 'Ok.' }],
    },
    blind_accept: {
      normal: [
        { id: 'r-blind-1', text: '¡Perfecto, gracias! Entonces cuento con esto para mañana, junto con lo demás.' },
        { id: 'r-blind-2', text: 'Excelente, sabía que podía contar contigo.' },
      ],
      guarded: [{ id: 'r-blind-g1', text: 'Ok, cuento con eso.' }],
    },
    reject: {
      normal: [
        { id: 'r-rej-1', text: '¿Cómo que no? Necesito que alguien lo saque y pensé en ti.' },
        { id: 'r-rej-2', text: 'Mmm, esperaba más disposición. Esto es importante para el área.' },
      ],
      guarded: [
        { id: 'r-rej-g1', text: 'Si la respuesta es solo "no", lo voy a tener que escalar.' },
        { id: 'r-rej-g2', text: 'Así no me ayudas a resolverlo.' },
      ],
    },
    pressure: {
      normal: [{ id: 'r-pre-1', text: 'Tranquilo, te estoy pidiendo apoyo, no es un capricho.' }],
      guarded: [{ id: 'r-pre-g1', text: 'Bájale un poco, ¿sí?' }],
    },
    blame: {
      normal: [
        { id: 'r-bla-1', text: 'No creo que sea para tanto. Todos estamos con carga.' },
        { id: 'r-bla-2', text: 'No te lo estoy pidiendo para complicarte la vida.' },
      ],
      guarded: [{ id: 'r-bla-g1', text: 'Ok. Veo que no es buen momento.' }],
    },
    hostile: {
      normal: [{ id: 'r-hos-1', text: 'No me hables así. Te estoy pidiendo apoyo.' }],
      guarded: [{ id: 'r-hos-g1', text: 'Así no vamos a llegar a nada.' }],
    },
  },
  closings: {
    agreement: {
      normal: [
        {
          id: 'end-ok-1',
          text: 'Perfecto: lo nuevo va primero, lo demás se ajusta como acordamos y me lo entregas {deadline}. Gracias por plantearlo así.',
        },
      ],
      guarded: [{ id: 'end-ok-g1', text: 'Ok, quedamos así: {deadline}. Cuento con eso.' }],
    },
    last_adjustment: {
      normal: [{ id: 'end-adj-1', text: 'Va, ajusta lo que propones y mañana a primera hora revisamos cómo vas con todo.' }],
      guarded: [{ id: 'end-adj-g1', text: 'Ajusta lo que puedas y luego vemos.' }],
    },
    overcommitted: {
      normal: [{ id: 'end-over-1', text: 'Perfecto, entonces cuento con todo para mañana.' }],
      guarded: [{ id: 'end-over-g1', text: 'Ok, cuento con todo para mañana.' }],
    },
    cannot_commit: {
      normal: [{ id: 'end-no-1', text: 'Bueno, intenta sacar todo y me avisas cómo vas.' }],
      guarded: [{ id: 'end-no-g1', text: 'Intenta sacarlo y me avisas.' }],
    },
    deteriorated: {
      normal: [{ id: 'end-bad-1', text: 'Ok. Lo platicamos después con más calma.' }],
      guarded: [{ id: 'end-bad-g1', text: 'Ok. Lo platicamos después con más calma.' }],
    },
  },
};
