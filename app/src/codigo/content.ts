import type { Group, RoleId } from './types';

/**
 * Código Clip · contenido.
 *
 * Fuente: el archivo "codigo-clip-personajes-pistas-rescate.md", la
 * presentación OB (Octubre 2026, 75 diapositivas) y la de Talent Performance
 * (Goal Setting y CRL Continuo, 29 diapositivas). `ref` es la diapositiva
 * ("OB p.15", "TP p.13") o explica por qué no hay una. Nada de esto está validado
 * como oficial: `estado` es 'propuesta' (dato con fuente, por validar),
 * 'diseño' (texto que redacté para el juego, no viene de la presentación) o
 * 'pendiente' (falta la fuente o la presentación no lo responde).
 */
export type Estado = 'propuesta' | 'diseño' | 'pendiente';

export type Pista = {
  id: string;
  texto: string;
  /** Lo que la presentación responde: para el banco del facilitador. */
  respuesta: string;
  ref: string;
  estado: Estado;
};

export type RoleDef = {
  id: RoleId;
  nombre: string;
  emoji: string;
  grupo: Group | null;
  /** Texto de la tarjeta (del md). */
  descripcion: string;
  resumen: string;
  individuales: Pista[];
};

export const GROUP_LABEL: Record<Group, string> = { comercio: 'Grupo Comercio', venta: 'Grupo Venta' };

/** Rasgos compartidos por grupo: dos personas que coinciden en uno son aliadas. */
export const SHARED: Record<Group, Pista[]> = {
  comercio: [
    {
      id: 'com-1',
      texto: 'Me importa saber cuándo me llega el dinero de mis ventas.',
      respuesta: 'Sin respuesta en la presentación OB. El md cita "diap. 27–28", pero esas diapositivas hablan del efectivo en México y del cobro con el celular.',
      ref: 'Sin fuente (md: diap. 27–28)',
      estado: 'pendiente',
    },
    {
      id: 'com-2',
      texto: 'Elegí Clip porque cuida mis datos: está certificado en seguridad.',
      respuesta: 'Clip sigue los estándares de Banco de México, los requerimientos de la CNBV y la ABM, cumple las reglas de Visa, Mastercard y American Express, y está certificado por EMVCo y PCI.',
      ref: 'OB p.71–72',
      estado: 'propuesta',
    },
  ],
  venta: [
    {
      id: 'ven-1',
      texto: 'Siempre le digo al cliente qué gana con nosotros.',
      respuesta: 'Clip nació con tres ideas: libertad de pago, excelente servicio y soporte al usuario (p.9). Mi Clip suma una bóveda para tu dinero, Customer Happiness 24/7 y cashback (p.30–31).',
      ref: 'OB p.9, p.30–31',
      estado: 'propuesta',
    },
    {
      id: 'ven-2',
      texto: 'Sé si una venta funcionó porque lo mido con un KPI.',
      respuesta: 'Con un KPI, el indicador de éxito: "¿Cómo se medirá el éxito y la calidad?" (TP p.13). Ejemplo: +15% de usuarios activos que usan "Pagos Recurrentes" (TP p.14). Los objetivos 2026 de Clip incluyen TPV growth 30% YoY (OB p.42).',
      ref: 'TP p.12–14; OB p.42',
      estado: 'propuesta',
    },
  ],
};

/** Phishing: una pista de cada grupo, ligeramente desfasada (del md: "señuelo"). */
export const DECOY_SHARED: Pista[] = [
  {
    id: 'phi-com',
    texto: 'Lo que más me preocupa es cuándo cobro lo que vendo.',
    respuesta: 'Señuelo: parece la pista del Grupo Comercio, pero con otras palabras.',
    ref: 'Diseño (imita com-1)',
    estado: 'diseño',
  },
  {
    id: 'phi-ven',
    texto: 'Le digo a la gente lo que gana conmigo.',
    respuesta: 'Señuelo: parece la pista del Grupo Venta, pero con otras palabras.',
    ref: 'Diseño (imita ven-1)',
    estado: 'diseño',
  },
];

/** Phishing: pistas individuales que contradicen al grupo que imita. Todas son de diseño. */
export const DECOY_INDIVIDUAL: Record<Group, Pista[]> = {
  comercio: [
    {
      id: 'phi-c1',
      texto: 'A mí el dinero de mis ventas me llega en 2 días.',
      respuesta: 'Contradicción de diseño (ejemplo del md). La presentación no da el plazo.',
      ref: 'Diseño (md)',
      estado: 'diseño',
    },
    {
      id: 'phi-c2',
      texto: 'Verifico mi terminal mandando mi NIP por correo.',
      respuesta: 'Bandera roja: no se comparten datos de tarjeta (p.72) y "Piensa antes de hacer clic" (p.74).',
      ref: 'Diseño; contradice OB p.72, p.74',
      estado: 'diseño',
    },
    {
      id: 'phi-c3',
      texto: 'Guardo los números de tarjeta de mis clientes para probar la terminal.',
      respuesta: 'Bandera roja: "No almacenes o compartas datos de tarjeta de nuestros clientes".',
      ref: 'Diseño; contradice OB p.72',
      estado: 'diseño',
    },
  ],
  venta: [
    {
      id: 'phi-v1',
      texto: 'Activo la bóveda de Mi Clip mandando mi contraseña por WhatsApp.',
      respuesta: 'Bandera roja: "Cuida tus accesos" y "Piensa antes de hacer clic".',
      ref: 'Diseño; contradice OB p.74',
      estado: 'diseño',
    },
    {
      id: 'phi-v2',
      texto: 'Mi Clip me da 50% de cashback en todo.',
      respuesta: 'Dato falso: la pantalla de Mi Clip muestra 5% de cashback en recargas de tiempo aire.',
      ref: 'Diseño; contradice OB p.30–31',
      estado: 'diseño',
    },
    {
      id: 'phi-v3',
      texto: 'Para vender más, pido los datos de tarjeta de los clientes y los registro yo.',
      respuesta: 'Bandera roja: "No almacenes o compartas datos de tarjeta…"; ante la duda, consulta a Infosec.',
      ref: 'Diseño; contradice OB p.72',
      estado: 'diseño',
    },
  ],
};

const p = (id: string, texto: string, respuesta: string, ref: string, estado: Estado = 'propuesta'): Pista => ({
  id,
  texto,
  respuesta,
  ref,
  estado,
});

export const ROLES: Record<RoleId, RoleDef> = {
  phishing: {
    id: 'phishing',
    nombre: 'Phishing',
    emoji: '🎣',
    grupo: null,
    resumen: 'Quiere robar datos sin ser descubierto.',
    descripcion:
      'Tu misión es obtener datos personales de Clip. Finge ser alguien del equipo. Tus rasgos son de un personaje que no existe.',
    individuales: [],
  },
  merchant_fan: {
    id: 'merchant_fan',
    nombre: 'Merchant fan de Clip',
    emoji: '🤩',
    grupo: 'comercio',
    resumen: 'Confía en la marca y la recomienda.',
    descripcion: 'Usas Clip desde hace años y lo recomiendas a todos. Te emociona cada novedad.',
    individuales: [
      p(
        'fan-1',
        'Mi primera terminal fue la Clip Plus, con teclado para el NIP.',
        '2017: Clip Plus, con Bluetooth y teclado para NIP. Ojo: la línea de tiempo de p.16 lo dibuja más cerca de 2018.',
        'OB p.14 (p.16 no coincide)',
      ),
      p('fan-2', 'Presumo que Clip tiene la certificación "Hecho en México" (2025).', 'En 2025 Clip recibió la certificación "Hecho en México" de la Secretaría de Economía: una marca mexicana, para negocios mexicanos.', 'OB p.50'),
      p('fan-3', 'Me sé de memoria los 6 valores de Clip.', 'We devote, We are trustworthy, We learn, We adapt, We obsess y We share.', 'OB p.57'),
    ],
  },
  merchant_desconfiado: {
    id: 'merchant_desconfiado',
    nombre: 'Merchant desconfiado',
    emoji: '🤨',
    grupo: 'comercio',
    resumen: 'Pregunta todo, sobre todo de sus datos.',
    descripcion: 'Clip te cobró algo que no entendiste. Quieres saber quién ve tus datos y cómo se protegen.',
    individuales: [
      p('des-1', 'Antes de confiar, revisé que Clip estuviera certificado por PCI y EMVCo.', 'Sí: certificado por EMVCo y PCI (PCI DSS), y regulado por Banxico, la CNBV y la ABM.', 'OB p.71–72'),
      p('des-2', 'Sé que Clip se conecta directo al SPEI de Banco de México.', 'Las transferencias del Banco de México. Clip, a través de Pocket Group, es participante directo del SPEI, lo que le exige un alto nivel de seguridad de la información.', 'OB p.73'),
      p('des-3', 'Si veo algo raro, lo reporto sin miedo.', 'Repórtalo sin miedo a infosecurityalert@payclip.com. La seguridad es un trabajo en equipo.', 'OB p.74'),
    ],
  },
  merchant_confuso: {
    id: 'merchant_confuso',
    nombre: 'Merchant confuso',
    emoji: '😵‍💫',
    grupo: 'comercio',
    resumen: 'No sabe qué hace cada función.',
    descripcion: 'Tienes un Clip, pero no sabes qué terminal te conviene ni para qué sirve cada función. Pides explicaciones.',
    individuales: [
      p('con-1', 'Todavía confundo la Clip Plus con la Clip Pro.', 'Clip Plus (2017): Bluetooth con teclado para NIP. Clip Pro (2018): internet móvil gratis e ilimitado.', 'OB p.14'),
      p('con-2', 'Escucho "TPV" en todos lados y no sé qué es.', 'El OB solo lo menciona en los objetivos 2026 ("TPV growth 30% YoY") y no lo define.', 'OB p.42 (sin definición)', 'pendiente'),
      p('con-3', 'Me piden un KPI y no sé qué poner.', 'El indicador de éxito de una meta: "¿Cómo se medirá el éxito y la calidad?" Es uno de los 5 elementos de #MetasGanadoras (meta, descripción, valor Clip, KPI, peso).', 'TP p.12–13'),
    ],
  },
  vendedor_clip: {
    id: 'vendedor_clip',
    nombre: 'Vendedor de Clip',
    emoji: '💼',
    grupo: 'venta',
    resumen: 'Quiere que el merchant use más terminales y pagos.',
    descripcion: 'Conoces los productos para comercio. Tu meta es que el merchant se quede con Clip y use más servicios.',
    individuales: [
      p('vcl-1', 'Les cuento a los merchants que Clip tiene más de 42 mil comercios activos.', 'Más de 42 mil comercios activos.', 'OB p.20'),
      p('vcl-2', 'Les ofrezco Wansoft a los restaurantes.', 'Wansoft: software y punto de venta para restaurantes.', 'OB p.24'),
      p('vcl-3', 'Mi terminal favorita para vender es la que imprime tickets.', '2019: terminal con impresora de tickets integrada.', 'OB p.14'),
    ],
  },
  vendedor_miclip: {
    id: 'vendedor_miclip',
    nombre: 'Vendedor de Mi Clip',
    emoji: '📱',
    grupo: 'venta',
    resumen: 'Quiere que la gente pague y ahorre con Mi Clip.',
    descripcion: 'Conoces Mi Clip: pagos sin contacto, widgets y la bóveda para tu dinero. Tu meta es que la gente lo use.',
    individuales: [
      p('vmc-1', 'Enseño a pagar con Mi Clip acercando el celular (NFC).', '"Paga en cualquier lugar": pagos sin contacto con NFC.', 'OB p.32–33'),
      p('vmc-2', 'Presumo que Mi Clip pasó de 399 mil instalaciones en su primer mes.', 'Más de 399 mil instalaciones únicas en un mes desde el lanzamiento (datos al 31 de julio).', 'OB p.38'),
      p('vmc-3', 'Le muestro a la gente las mini-apps de Mi Clip.', 'La diferenciación de Mi Clip: "Mis Apps, hazlo todo aquí", con apps de otras marcas dentro de Mi Clip.', 'OB p.33–36'),
    ],
  },
  fan_miclip: {
    id: 'fan_miclip',
    nombre: 'Fan de Mi Clip',
    emoji: '💖',
    grupo: 'venta',
    resumen: 'Lo usa todos los días y lo recomienda.',
    descripcion: 'Usas Mi Clip todos los días. Eres el primero en recomendarlo y te gusta mostrar sus funciones.',
    individuales: [
      p('fmc-1', 'Uso Mi Clip desde que salió para personas, en mayo de 2026.', 'Mayo 2026: Clip llega al consumidor final con Ant International, Mastercard y TelevisaUnivision, para cerrar el círculo entre comercios y personas.', 'OB p.29–30'),
      p('fmc-2', 'Pago mis servicios y recargas desde el widget de Mi Clip.', '"Widget inteligente y casos de uso": accesos para pagar servicios, recargar celular o tag, entre otros.', 'OB p.31, p.34'),
      p('fmc-3', 'Cuando tengo una duda, me atiende Customer Happiness a cualquier hora.', 'Atiende a los usuarios de Mi Clip las 24 horas. La presentación lo nombra pero no lo detalla.', 'OB p.30 (sin detalle)', 'pendiente'),
    ],
  },
  persona_normal: {
    id: 'persona_normal',
    nombre: 'Persona normal',
    emoji: '🙂',
    grupo: null,
    resumen: 'La voz del cliente final.',
    descripcion: 'Usas Mi Clip para tus pagos del día a día. Eres la voz del cliente final.',
    individuales: [
      p('pn-1', 'Me gusta que mi dinero rinda más con el cashback.', 'En la pantalla de Mi Clip va junto al cashback (por ejemplo, 5% en recargas de tiempo aire). La presentación no lo explica más.', 'OB p.31 (interpretación)', 'pendiente'),
      p('pn-2', 'A veces pago sin sacar la tarjeta.', 'Ambiguo: puede ser el pago sin tarjeta presente (2020, p.15) o el celular como terminal (marzo 2026, p.28).', 'OB p.15 o p.28', 'pendiente'),
      p('pn-3', 'Guardo mi dinero en la bóveda de Mi Clip porque me da confianza.', 'Mi Clip: "Seguridad y confianza: una bóveda para tu dinero" y Customer Happiness 24/7.', 'OB p.30'),
      p('pn-4', 'Uso Mi Clip para mis pagos de todos los días.', 'La plataforma de consumo de Clip para personas, lanzada en mayo de 2026.', 'OB p.29–30', 'diseño'),
      p('pn-5', 'Vi el lanzamiento de Mi Clip con Mastercard y TelevisaUnivision.', 'Ant International, Mastercard y TelevisaUnivision.', 'OB p.29', 'diseño'),
    ],
  },
};

/** Los 5 rasgos que ve un jugador: frases de su personaje que debe reconocer en otros. */
export function pistasFor(role: RoleId, decoy: Group | null): Pista[] {
  if (role === 'phishing') return [...DECOY_SHARED, ...DECOY_INDIVIDUAL[decoy ?? 'comercio']];
  const def = ROLES[role];
  if (!def.grupo) return def.individuales;
  return [...SHARED[def.grupo], ...def.individuales];
}

export type Rescate = { pregunta: string; respuesta: string; ref: string; estado: Estado };

export type Section = {
  id: string;
  titulo: string;
  tema: string | null;
  rescate: Rescate | null;
  /** La pregunta propia de quien ya es auditor. */
  auditor: Rescate | null;
};

/** Agenda MX (OB p.3). Firma de contrato y Comida no tienen rescate (md). */
export const SECTIONS: Section[] = [
  {
    id: 'quienes',
    titulo: '¿Quiénes somos?',
    tema: 'Negocio',
    rescate: {
      pregunta: '¿Qué empresa adquirió Clip en 2020 para ser un agregador de pagos?',
      respuesta: 'Swap (institución de fondos de pago electrónico, IFPE).',
      ref: 'OB p.15',
      estado: 'propuesta',
    },
    auditor: {
      pregunta: '¿En qué año se fundó Clip y con qué nombre?',
      respuesta: '27 de septiembre de 2012, como BlitzPay Inc. (Adolfo Babatz).',
      ref: 'OB p.13',
      estado: 'diseño',
    },
  },
  { id: 'firma', titulo: 'Firma de contrato', tema: null, rescate: null, auditor: null },
  {
    id: 'promesa',
    titulo: 'Promesa Clip',
    tema: 'Cultura',
    rescate: {
      pregunta: 'Completa: "Ego off, ___".',
      respuesta: 'Impact on. Ojo: está en el Perfil Clipper / Leadership Framework (p.62–63), no en la lista de valores (p.57).',
      ref: 'OB p.63',
      estado: 'propuesta',
    },
    auditor: {
      pregunta: 'Menciona 3 de los 6 valores de Clip.',
      respuesta: 'We devote, We are trustworthy, We learn, We adapt, We obsess, We share.',
      ref: 'OB p.57',
      estado: 'diseño',
    },
  },
  { id: 'comida', titulo: 'Comida', tema: null, rescate: null, auditor: null },
  { id: 'equipos', titulo: 'Configuración de equipos', tema: null, rescate: null, auditor: null },
  {
    id: 'tp',
    titulo: 'Talent Performance',
    tema: 'Talent Performance',
    rescate: {
      pregunta: '¿Cuántas metas semestrales pide el estándar #MetasGanadoras y cuál es su peso mínimo y máximo?',
      respuesta: 'Mínimo 3 y máximo 6 metas, semestrales; peso por cada una de 5% a 40%.',
      ref: 'TP p.13',
      estado: 'propuesta',
    },
    auditor: {
      pregunta: '¿Qué significa CRL en "CRL Continuo" y cada cuánto se hace?',
      respuesta: 'Checa–Recalcula–Logra: checa los avances, recalcula las metas si hace falta y celebra los logros. Es mensual (al menos 1 cada trimestre).',
      ref: 'TP p.18, p.25',
      estado: 'diseño',
    },
  },
  {
    id: 'ciber',
    titulo: 'Charla de Ciberseguridad',
    tema: 'Seguridad',
    rescate: {
      pregunta: '¿Qué es PCI DSS y cuántos requisitos técnicos tiene?',
      respuesta: 'Un estándar internacional de seguridad para quien acepta, procesa, almacena o transmite datos de tarjetas: 6 objetivos y 12 requisitos técnicos y operativos.',
      ref: 'OB p.72',
      estado: 'propuesta',
    },
    auditor: {
      pregunta: '¿A qué correo reportas algo raro?',
      respuesta: 'infosecurityalert@payclip.com ("Reporta sin miedo").',
      ref: 'OB p.74',
      estado: 'diseño',
    },
  },
];

/** Índices de las secciones con rescate. La migración 002 repite esta lista. */
export const RESCUE_SECTIONS = SECTIONS.flatMap((s, i) => (s.rescate ? [i] : []));

/** La votación se abre después de la primera plática. */
export const FIRST_TALK = 0;


/** Barras de vida: empiezan en 100. Nunca se gana por eliminar a otros. */
export const LIFE = { start: 100, perVote: -10, rescueRight: 15, rescueWrong: -5 } as const;

export const MIN_PLAYERS = 3;

/**
 * Ronda de aliados: "¿quién es de tu equipo?". Comercio y Venta son equipos;
 * los phishing son equipo entre ellos; la persona normal no tiene equipo.
 * La migración 004 repite esta regla en SQL.
 */
export function allyTeam(role: RoleId): string | null {
  if (role === 'phishing') return 'phishing';
  return ROLES[role].grupo;
}

type Listen = { seccion: string; escucha: string };

/**
 * Tips por sección (diseño, por validar): en qué sección se habla de cada rasgo
 * y qué escuchar para reconocerlo o defenderlo en la ronda de preguntas.
 */
export const LISTEN: Record<string, Listen> = {
  'com-1': { seccion: 'quienes', escucha: 'cómo y cuándo reciben su dinero los comercios (la presentación no lo dice: pregúntalo)' },
  'com-2': { seccion: 'ciber', escucha: 'qué certificaciones de seguridad tiene Clip' },
  'ven-1': { seccion: 'quienes', escucha: 'las 3 ideas con las que nació Clip y lo que gana el usuario de Mi Clip' },
  'ven-2': { seccion: 'tp', escucha: 'qué es un KPI dentro de las #MetasGanadoras' },
  'phi-com': { seccion: 'quienes', escucha: 'cómo hablan los comercios de su dinero, para sonar como uno de ellos' },
  'phi-ven': { seccion: 'quienes', escucha: 'qué beneficios presume Clip, para sonar como vendedor' },
  'phi-c1': { seccion: 'quienes', escucha: 'qué dice la presentación del dinero de las ventas: tu rasgo podría delatarte' },
  'phi-c2': { seccion: 'ciber', escucha: 'qué NO se hace con el NIP y los correos raros: tu rasgo dice lo contrario, defiéndelo sin que te descubran' },
  'phi-c3': { seccion: 'ciber', escucha: 'qué dice PCI DSS de guardar datos de tarjeta: tu rasgo lo rompe' },
  'phi-v1': { seccion: 'ciber', escucha: 'por qué nunca se comparten accesos: tu rasgo lo hace' },
  'phi-v2': { seccion: 'quienes', escucha: 'cuánto cashback da de verdad Mi Clip: tu rasgo exagera' },
  'phi-v3': { seccion: 'ciber', escucha: 'qué hacer si un proceso te pide datos de tarjeta: tu rasgo lo hace mal' },
  'fan-1': { seccion: 'quienes', escucha: 'cuándo salió la Clip Plus y qué la hacía especial' },
  'fan-2': { seccion: 'promesa', escucha: 'qué es la certificación "Hecho en México" y quién la dio' },
  'fan-3': { seccion: 'promesa', escucha: 'los 6 valores de Clip (We devote, We learn…)' },
  'des-1': { seccion: 'ciber', escucha: 'quién regula y certifica a Clip (Banxico, CNBV, PCI, EMVCo)' },
  'des-2': { seccion: 'ciber', escucha: 'qué es el SPEI y cómo se conecta Clip' },
  'des-3': { seccion: 'ciber', escucha: 'a dónde se reporta algo raro' },
  'con-1': { seccion: 'quienes', escucha: 'la diferencia entre la Clip Plus y la Clip Pro' },
  'con-2': { seccion: 'quienes', escucha: 'los objetivos 2026 de Clip (ahí aparece el TPV)' },
  'con-3': { seccion: 'tp', escucha: 'qué es un KPI y cómo se usa en una meta' },
  'vcl-1': { seccion: 'quienes', escucha: 'cuántos comercios activos tiene Clip' },
  'vcl-2': { seccion: 'quienes', escucha: 'qué empresa adquirió Clip en 2025 y para quién es' },
  'vcl-3': { seccion: 'quienes', escucha: 'qué terminal imprime tickets y cuándo salió' },
  'vmc-1': { seccion: 'quienes', escucha: 'cómo se paga sin contacto con Mi Clip' },
  'vmc-2': { seccion: 'quienes', escucha: 'cuántas instalaciones tuvo Mi Clip en su primer mes' },
  'vmc-3': { seccion: 'quienes', escucha: 'qué son las mini-apps de Mi Clip' },
  'fmc-1': { seccion: 'quienes', escucha: 'cuándo y con quién llegó Mi Clip a las personas' },
  'fmc-2': { seccion: 'quienes', escucha: 'qué se puede hacer desde el widget inteligente' },
  'fmc-3': { seccion: 'quienes', escucha: 'qué es 24/7 Customer Happiness' },
  'pn-1': { seccion: 'quienes', escucha: 'cómo "Haz rendir más tu dinero" (cashback)' },
  'pn-2': { seccion: 'quienes', escucha: 'cómo se cobra hoy sin tarjeta física (el celular como terminal)' },
  'pn-3': { seccion: 'quienes', escucha: 'qué es la bóveda de Mi Clip' },
  'pn-4': { seccion: 'quienes', escucha: 'qué es Mi Clip y para quién es' },
  'pn-5': { seccion: 'quienes', escucha: 'con quién se alió Clip para lanzar Mi Clip' },
};

/** Qué escuchar para la pregunta rescate de cada sección. */
export const RESCUE_LISTEN: Record<string, string> = {
  quienes: 'qué empresa adquirió Clip en 2020 y para qué',
  promesa: 'el Perfil Clipper: "Ego off, …"',
  tp: 'cuántas metas pide #MetasGanadoras y cuánto pesa cada una',
  ciber: 'qué es PCI DSS y cuántos requisitos tiene',
};

const GENERAL_TIP: Record<string, string> = {
  firma: 'Aprovecha la pausa: platica y busca quién comparte tus rasgos.',
  comida: 'En la comida, platica con quien no conoces y escucha si repite alguno de tus rasgos.',
  equipos: 'Fíjate en quién queda contigo en el equipo: ¿comparte algún rasgo?',
};

export type Tip = { kind: 'rasgo' | 'rescate' | 'general'; texto: string; rasgo?: string };

/** Los tips "Pon atención a…" de un personaje en una sección. */
export function tipsFor(role: RoleId, decoy: Group | null, sectionIndex: number): Tip[] {
  const sec = SECTIONS[sectionIndex];
  if (!sec) return [];
  const tips: Tip[] = pistasFor(role, decoy)
    .filter((p) => LISTEN[p.id]?.seccion === sec.id)
    .map((p) => ({ kind: 'rasgo' as const, texto: LISTEN[p.id].escucha, rasgo: p.texto }));
  if (RESCUE_LISTEN[sec.id]) tips.push({ kind: 'rescate', texto: RESCUE_LISTEN[sec.id] });
  if (tips.length === 0) tips.push({ kind: 'general', texto: GENERAL_TIP[sec.id] ?? 'Escucha con atención y busca tus rasgos en otras personas.' });
  return tips;
}

/** "¿De qué va?": lo primero que lee cada quien en su celular. */
export const ABOUT =
  'Código Clip es un juego para conocer Clip mientras escuchas la presentación de bienvenida: el negocio, la cultura, Talent Performance y la seguridad. Cada quien recibe un personaje con rasgos. Tu misión: encontrar a tu equipo escuchando lo que dicen los demás, y descubrir a los phishing antes de que roben datos. Lo que aprendas en cada sección te sirve para reconocer rasgos y para responder tu pregunta rescate.';
