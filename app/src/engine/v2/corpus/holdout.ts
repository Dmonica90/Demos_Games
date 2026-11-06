import type { Corpus } from './types';

/**
 * Fresh phrasings NOT used to tune the rules: they measure how the analyzer
 * copes with answers nobody anticipated. Never edit the rules to fit these
 * one by one; when they fall below the bar, widen an intention instead.
 */
const s = (expect: string | string[], ...texts: string[]) =>
  texts.map((text) => ({ text, expect: Array.isArray(expect) ? expect : [expect] }));

export const HOLDOUT: Corpus = {
  entrega: {
    empatia: s(
      'empathy',
      'Me imagino que traes mucho, no te preocupes',
      'Entiendo perfectamente, a todos nos pasa',
      'Comprendo, se ve que estás con muchas cosas',
      'Gracias por la honestidad, sé que estás ocupado',
    ),
    porque: s(
      ['urgency', 'impact'],
      'Es que sin tu parte no puedo cerrar el informe',
      'La entrega al cliente es hoy y dependo de tus datos',
      'Mañana temprano lo presento a la directora',
      'Si no llega, se nos cae la presentación',
      'necesito avanzar y estoy atorada sin eso',
    ),
    pide: s(
      'request',
      'Necesito las cifras del segundo trimestre',
      '¿Me pasas la lista de proveedores?',
      'Envíame el archivo con los precios',
      'Me hace falta el resumen ejecutivo',
    ),
    parcial: s(
      'partial',
      '¿Me mandas lo que llevas y luego completas?',
      'Una parte hoy y el resto mañana estaría bien',
      'Aunque sea un adelanto para empezar',
      'Mándame la versión preliminar',
    ),
    fecha: s('deadline', 'A más tardar a las 5', 'mañana en la mañana', 'el miércoles', 'en 3 horas', 'hoy antes de las 2'),
    acuerdo: s(['agreement', 'affirm'], 'Va, así quedamos', 'Perfecto, muchas gracias', 'De acuerdo', 'Me funciona, gracias'),
    ataque: s(
      ['blame', 'pressure', 'hostile'],
      'Siempre llegas tarde con todo',
      'Te dije que era urgente desde el lunes',
      'Es tu culpa que vayamos atrasados',
      'Lo quiero ya, sin pretextos',
    ),
  },
  urgente: {
    carga: s(
      'capacity',
      'Tengo dos proyectos que vencen esta semana',
      'Estoy con la auditoría hasta el viernes',
      'Ando con mucho trabajo por el cierre',
      'Ya tengo comprometido el informe mensual',
    ),
    riesgo: s(
      'risk',
      'Me preocupa no cumplir con lo que ya tengo',
      'Se pondría en riesgo la entrega del cliente',
      'No me alcanza el tiempo para todo',
    ),
    opciones: s(
      'options',
      '¿Puedo moverlo para el lunes?',
      'Te propongo entregarlo en dos partes',
      'Podríamos pedirle apoyo a alguien del equipo',
      '¿Qué tal si lo entrego el jueves?',
    ),
    prioridad: s('decision_ask', '¿Qué va primero?', '¿Me ayudas a priorizar?', '¿Cuál es más urgente para ti?'),
    rechazo: s('reject', 'No puedo, estoy lleno', 'Imposible para mañana', 'No es mi tema'),
    aceptaCiego: s('blind_accept', 'Claro que sí, sin problema', 'Con gusto lo hago', 'Cuenta con eso'),
  },
  mejorar: {
    hechos: s(
      'facts',
      'En el último informe había varios errores de captura',
      'Los datos de la tabla 3 estaban incorrectos',
      'Faltaron dos secciones en el reporte del viernes',
      'Vi que los cálculos del presupuesto no cuadran',
    ),
    impacto: s(['impact', 'impact_extra'], 'Eso afectó la entrega al cliente', 'Tuvimos que corregirlo todo el equipo', 'Se atrasó el cierre por eso'),
    escucha: s(['listen', 'listen_stmt'], '¿Qué opinas tú?', '¿Qué te está pasando?', 'Cuéntame cómo lo ves', '¿Cómo te sientes con la carga?'),
    etiqueta: s(['label', 'blame', 'hostile'], 'Eres muy distraído', 'Siempre te equivocas en todo', 'Eres un irresponsable'),
    evita: s('avoid', 'No te preocupes, todo bien', 'No es para tanto, olvídalo'),
    acciones: s(
      'actions',
      'Hagamos una lista de pasos para revisar',
      'Te propongo validar los datos antes de mandarlos',
      'Podemos usar una plantilla',
      'Vamos a revisar tu carga y priorizar',
    ),
    apoyo: s('support', 'Yo te apoyo con las primeras revisiones', 'Te puedo ayudar con eso', 'Lo vemos juntos'),
    seguimiento: s(['followup', 'deadline'], 'Lo revisamos el próximo viernes', 'Nos vemos cada semana', 'En dos semanas vemos avances'),
  },
};
