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

/** Pistas compartidas por grupo: dos personas que coinciden en una son aliadas. */
export const SHARED: Record<Group, Pista[]> = {
  comercio: [
    {
      id: 'com-1',
      texto: '¿Cuánto tarda en llegarme el dinero de mis ventas?',
      respuesta: 'Sin respuesta en la presentación OB. El md cita "diap. 27–28", pero esas diapositivas hablan del efectivo en México y del cobro con el celular.',
      ref: 'Sin fuente (md: diap. 27–28)',
      estado: 'pendiente',
    },
    {
      id: 'com-2',
      texto: '¿Clip cuida mis datos?',
      respuesta: 'Clip sigue los estándares de Banco de México, los requerimientos de la CNBV y la ABM, cumple las reglas de Visa, Mastercard y American Express, y está certificado por EMVCo y PCI.',
      ref: 'OB p.71–72',
      estado: 'propuesta',
    },
  ],
  venta: [
    {
      id: 'ven-1',
      texto: '¿Qué beneficio le damos al cliente?',
      respuesta: 'Clip nació con tres ideas: libertad de pago, excelente servicio y soporte al usuario (p.9). Mi Clip suma una bóveda para tu dinero, Customer Happiness 24/7 y cashback (p.30–31).',
      ref: 'OB p.9, p.30–31',
      estado: 'propuesta',
    },
    {
      id: 'ven-2',
      texto: '¿Cómo medimos si la venta funcionó?',
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
    texto: '¿En cuánto tiempo me llega el dinero de lo que vendo?',
    respuesta: 'Señuelo: parece la pista del Grupo Comercio, pero con otras palabras.',
    ref: 'Diseño (imita com-1)',
    estado: 'diseño',
  },
  {
    id: 'phi-ven',
    texto: '¿Qué ganan los clientes con nosotros?',
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
      texto: 'A mí el dinero me llega en 2 días, ¿a ti también?',
      respuesta: 'Contradicción de diseño (ejemplo del md). La presentación no da el plazo.',
      ref: 'Diseño (md)',
      estado: 'diseño',
    },
    {
      id: 'phi-c2',
      texto: 'Clip me pidió mi NIP por correo para verificar mi terminal, ¿a ti también?',
      respuesta: 'Bandera roja: no se comparten datos de tarjeta (p.72) y "Piensa antes de hacer clic" (p.74).',
      ref: 'Diseño; contradice OB p.72, p.74',
      estado: 'diseño',
    },
    {
      id: 'phi-c3',
      texto: '¿Me pasas el número de tarjeta con el que pruebas tu terminal?',
      respuesta: 'Bandera roja: "No almacenes o compartas datos de tarjeta de nuestros clientes".',
      ref: 'Diseño; contradice OB p.72',
      estado: 'diseño',
    },
  ],
  venta: [
    {
      id: 'phi-v1',
      texto: 'Mi Clip te pide tu contraseña por WhatsApp para activar la bóveda, ¿verdad?',
      respuesta: 'Bandera roja: "Cuida tus accesos" y "Piensa antes de hacer clic".',
      ref: 'Diseño; contradice OB p.74',
      estado: 'diseño',
    },
    {
      id: 'phi-v2',
      texto: 'El cashback de Mi Clip es de 50% en todo, ¿no?',
      respuesta: 'Dato falso: la pantalla de Mi Clip muestra 5% de cashback en recargas de tiempo aire.',
      ref: 'Diseño; contradice OB p.30–31',
      estado: 'diseño',
    },
    {
      id: 'phi-v3',
      texto: 'Para vender más, mándame los datos de tarjeta de tus clientes y yo los registro.',
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
      'Tu misión es obtener datos personales de Clip. Finge ser alguien del equipo. Tus pistas son de un personaje que no existe.',
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
        '¿Cuándo salió el Clip Plus?',
        '2017: Clip Plus, con Bluetooth y teclado para NIP. Ojo: la línea de tiempo de p.16 lo dibuja más cerca de 2018.',
        'OB p.14 (p.16 no coincide)',
      ),
      p('fan-2', '¿Qué significa "Hecho en México"?', 'En 2025 Clip recibió la certificación "Hecho en México" de la Secretaría de Economía: una marca mexicana, para negocios mexicanos.', 'OB p.50'),
      p('fan-3', '¿Cuáles son los valores de Clip?', 'We devote, We are trustworthy, We learn, We adapt, We obsess y We share.', 'OB p.57'),
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
      p('des-1', '¿Clip está certificado en seguridad?', 'Sí: certificado por EMVCo y PCI (PCI DSS), y regulado por Banxico, la CNBV y la ABM.', 'OB p.71–72'),
      p('des-2', '¿Qué es el SPEI?', 'Las transferencias del Banco de México. Clip, a través de Pocket Group, es participante directo del SPEI, lo que le exige un alto nivel de seguridad de la información.', 'OB p.73'),
      p('des-3', '¿Qué pasa si veo algo raro?', 'Repórtalo sin miedo a infosecurityalert@payclip.com. La seguridad es un trabajo en equipo.', 'OB p.74'),
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
      p('con-1', '¿Cuál es la diferencia entre Clip Plus y Clip Pro?', 'Clip Plus (2017): Bluetooth con teclado para NIP. Clip Pro (2018): internet móvil gratis e ilimitado.', 'OB p.14'),
      p('con-2', '¿Qué es un TPV?', 'El OB solo lo menciona en los objetivos 2026 ("TPV growth 30% YoY") y no lo define.', 'OB p.42 (sin definición)', 'pendiente'),
      p('con-3', '¿Qué es un KPI?', 'El indicador de éxito de una meta: "¿Cómo se medirá el éxito y la calidad?" Es uno de los 5 elementos de #MetasGanadoras (meta, descripción, valor Clip, KPI, peso).', 'TP p.12–13'),
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
      p('vcl-1', '¿Cuántos comercios activos tiene Clip?', 'Más de 42 mil comercios activos.', 'OB p.20'),
      p('vcl-2', '¿Qué adquirió Clip en 2025?', 'Wansoft: software y punto de venta para restaurantes.', 'OB p.24'),
      p('vcl-3', '¿Qué es el Clip Total?', '2019: terminal con impresora de tickets integrada.', 'OB p.14'),
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
      p('vmc-1', '¿Qué es el NFC en Mi Clip?', '"Paga en cualquier lugar": pagos sin contacto con NFC.', 'OB p.32–33'),
      p('vmc-2', '¿Cuántas instalaciones tuvo Mi Clip en su primer mes?', 'Más de 399 mil instalaciones únicas en un mes desde el lanzamiento (datos al 31 de julio).', 'OB p.38'),
      p('vmc-3', '¿Qué son las mini-apps?', 'La diferenciación de Mi Clip: "Mis Apps, hazlo todo aquí", con apps de otras marcas dentro de Mi Clip.', 'OB p.33–36'),
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
      p('fmc-1', '¿Cuál es la oferta de Mi Clip para el usuario?', 'Mayo 2026: Clip llega al consumidor final con Ant International, Mastercard y TelevisaUnivision, para cerrar el círculo entre comercios y personas.', 'OB p.29–30'),
      p('fmc-2', '¿Qué es el widget inteligente?', '"Widget inteligente y casos de uso": accesos para pagar servicios, recargar celular o tag, entre otros.', 'OB p.31, p.34'),
      p('fmc-3', '¿Qué hace el equipo de 24/7 Customer Happiness?', 'Atiende a los usuarios de Mi Clip las 24 horas. La presentación lo nombra pero no lo detalla.', 'OB p.30 (sin detalle)', 'pendiente'),
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
      p('pn-1', '¿Qué hace "Haz rendir más tu dinero"?', 'En la pantalla de Mi Clip va junto al cashback (por ejemplo, 5% en recargas de tiempo aire). La presentación no lo explica más.', 'OB p.31 (interpretación)', 'pendiente'),
      p('pn-2', '¿Qué pasa si pago sin tarjeta?', 'Ambiguo: puede ser el pago sin tarjeta presente (2020, p.15) o el celular como terminal (marzo 2026, p.28).', 'OB p.15 o p.28', 'pendiente'),
      p('pn-3', '¿Clip me cuida si algo sale mal?', 'Mi Clip: "Seguridad y confianza: una bóveda para tu dinero" y Customer Happiness 24/7.', 'OB p.30'),
      p('pn-4', '¿Qué es Mi Clip?', 'La plataforma de consumo de Clip para personas, lanzada en mayo de 2026.', 'OB p.29–30', 'diseño'),
      p('pn-5', '¿Con quién se alió Clip para Mi Clip?', 'Ant International, Mastercard y TelevisaUnivision.', 'OB p.29', 'diseño'),
    ],
  },
};

/** Las 5 pistas que ve un jugador. */
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
];

/** Índices de las secciones con rescate. La migración 002 repite esta lista. */
export const RESCUE_SECTIONS = SECTIONS.flatMap((s, i) => (s.rescate ? [i] : []));

/** La votación se abre después de la primera plática. */
export const FIRST_TALK = 0;

/** Sub-juego de venta: lo que el merchant marca. Todos son de diseño. */
export const SALE_CRITERIA: { id: string; texto: string; ref: string }[] = [
  { id: 'dato', texto: 'Me dio un dato real del producto (y supo de qué diapositiva sale)', ref: 'Diseño' },
  { id: 'beneficio', texto: 'Me explicó el beneficio para mi negocio o para mí', ref: 'Diseño; OB p.9' },
  { id: 'seguridad', texto: 'Respondió mi duda de seguridad sin pedirme datos', ref: 'Diseño; OB p.72, p.74' },
  { id: 'escucha', texto: 'Me preguntó qué necesito antes de ofrecerme algo', ref: 'Diseño' },
];

export const SELLER_ROLES: RoleId[] = ['vendedor_clip', 'vendedor_miclip'];
export const MERCHANT_ROLES: RoleId[] = ['merchant_fan', 'merchant_desconfiado', 'merchant_confuso'];

/** Puntos opcionales: por participar, nunca por ganar. */
export const POINTS = { vote: 1, rescueSent: 1, rescueRight: 2, sale: 1 } as const;
