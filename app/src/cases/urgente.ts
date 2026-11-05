import type { CaseDef } from './types';
import { urgenteConfig } from './v2/urgente.config';

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
  maxTurns: urgenteConfig.maxTurns,
  durationS: 420,
  v2: urgenteConfig,
  relevant: [
    'capacity',
    'risk',
    'options',
    'decision_ask',
    'empathy',
    'deadline',
    'agreement',
    'question',
    'reject',
    'blind_accept',
    'blame',
    'pressure',
    'hostile',
    'shouting',
    'vague',
    'short',
  ],
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
