import type { CaseDef } from './types';
import { entregaConfig } from './v2/entrega.config';

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
  maxTurns: entregaConfig.maxTurns,
  durationS: 360,
  v2: entregaConfig,
  relevant: [
    'empathy',
    'urgency',
    'impact',
    'request',
    'partial',
    'deadline',
    'agreement',
    'responsibility',
    'question',
    'blame',
    'pressure',
    'hostile',
    'shouting',
    'vague',
    'short',
  ],
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
