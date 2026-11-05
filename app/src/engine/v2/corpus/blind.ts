import type { Corpus } from './types';

/**
 * A third, blind set written after the rules were last widened. Its score is
 * the honest estimate of how the analyzer copes with unseen answers.
 */
const s = (expect: string | string[], ...texts: string[]) =>
  texts.map((text) => ({ text, expect: Array.isArray(expect) ? expect : [expect] }));

export const BLIND: Corpus = {
  entrega: {
    empatia: s('empathy', 'Entiendo que se te complicó la semana', 'Sé que tienes muchas cosas encima', 'Comprendo, me ha pasado'),
    porque: s(
      ['urgency', 'impact'],
      'Lo necesito porque el informe sale hoy',
      'Mi parte depende de lo tuyo',
      'Tengo que entregarle al cliente mañana temprano',
      'Sin eso no puedo terminar la presentación',
    ),
    pide: s('request', 'Necesito el reporte de gastos', 'Pásame las gráficas de ventas', 'Me falta la parte de conclusiones'),
    parcial: s('partial', 'Mándame lo que ya tengas listo', 'Con un avance me basta por hoy', 'Lo demás me lo pasas después'),
    fecha: s('deadline', 'Para las 4 estaría bien', 'Antes del mediodía', 'Mañana a las 9'),
    acuerdo: s(['agreement', 'affirm'], 'Ok, quedamos', 'Perfecto, así lo dejamos', 'Sí, de acuerdo'),
    ataque: s(['blame', 'pressure', 'hostile'], 'Como siempre, tarde', 'Es tu problema, resuélvelo', 'Eres un inútil'),
  },
  urgente: {
    carga: s('capacity', 'Estoy con el cierre de la nómina', 'Tengo tres entregas esta semana', 'Ya estoy trabajando en el reporte anual'),
    riesgo: s('risk', 'Si lo tomo se retrasaría lo demás', 'Podría bajar la calidad de mis entregas'),
    opciones: s('options', 'Te propongo moverlo al viernes', '¿Lo puedo entregar por partes?', 'Podría delegar una parte a Laura'),
    prioridad: s('decision_ask', '¿Qué priorizo primero?', '¿Qué prefieres que haga antes?'),
    rechazo: s('reject', 'No puedo con eso', 'No me corresponde'),
    aceptaCiego: s('blind_accept', 'Sin problema, lo hago', 'Sí claro, cuenta conmigo'),
  },
  mejorar: {
    hechos: s('facts', 'En el reporte de abril había errores en los totales', 'Los datos que mandaste no coincidían con el sistema', 'Faltaba la mitad de la información'),
    impacto: s(['impact', 'impact_extra'], 'Eso hizo que se retrasara el proyecto', 'El cliente se quejó por eso'),
    escucha: s(['listen', 'listen_stmt'], '¿Cómo te sientes con todo esto?', '¿Qué crees que está pasando?', 'Me gustaría escucharte'),
    etiqueta: s(['label', 'blame', 'hostile'], 'Eres muy despistado', 'Siempre haces lo mismo'),
    evita: s('avoid', 'Bueno, no pasa nada', 'Tranquilo, no es grave'),
    acciones: s('actions', 'Hagamos una revisión antes de enviar', 'Te propongo usar una checklist', 'Vamos a organizar mejor tus pendientes'),
    apoyo: s('support', 'Te ayudo con las primeras revisiones', 'Cuenta con mi apoyo'),
    seguimiento: s(['followup', 'deadline'], 'Lo vemos la próxima semana', 'Revisemos en 15 días'),
  },
};
