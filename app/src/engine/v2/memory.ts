import type { V2CaseConfig } from './config';
import type { Analysis, Memory } from './types';

export function emptyMemory(cfg: V2CaseConfig): Memory {
  return {
    flags: Object.fromEntries(cfg.flags.map((f) => [f.id, false])),
    asked_topics: [],
    ask_count: {},
    used_responses: [],
    pending_offer: null,
    slots: {},
  };
}

/**
 * Folds one message into what the character remembers. Facts only accumulate:
 * once something is understood it stays understood.
 */
export function updateMemory(cfg: V2CaseConfig, memory: Memory, a: Analysis, attacking: boolean): Memory {
  const flags = { ...memory.flags };
  for (const f of cfg.flags) {
    if (f.needsGoodwill && attacking) continue;
    if (f.unless?.some((u) => a.signals[u])) continue;
    if (f.from.some((s) => (a.signals[s] ?? 0) >= (f.minStrength ?? 0.5))) flags[f.id] = true;
  }
  const slots = { ...memory.slots };
  if (a.deliverable && a.signals.request === 1) slots.deliverable = a.deliverable;
  if (a.partial) slots.partial = a.partial;
  // A time only counts as the deadline when a deadline flag accepted it
  // ("esta semana entrego otra cosa" is not a date for this task).
  const deadlineCounts = cfg.flags.some(
    (f) => f.from.includes('deadline') && !(f.unless?.some((u) => a.signals[u])) && !(f.needsGoodwill && attacking),
  );
  const sameDay = (t: string) => !/ma[nñ]ana|lunes|martes|mi[eé]rcoles|jueves|viernes|semana|d[ií]as?/i.test(t);
  if (deadlineCounts && a.times.length > 1 && a.signals.partial) {
    // "lo validado hoy y el resto mañana": first time for the part, last for the rest.
    slots.partialWhen = a.partialWhen;
    slots.deadline = a.deadline;
  } else if (deadlineCounts && a.deadline) {
    const last = a.times[a.times.length - 1];
    if (flags.partial_delivery_proposed && slots.partialWhen && sameDay(last) && !sameDay(slots.deadline ?? '')) {
      // A time of day after a plan in parts tightens the first part ("antes de las dos").
      slots.partialWhen = last;
    } else {
      slots.deadline = a.deadline;
    }
  }
  return { ...memory, flags, slots };
}

/** The furthest stage reached; the task never moves back. */
export function taskStage(cfg: V2CaseConfig, flags: Memory['flags'], previous: string): string {
  const order = ['not_started', ...cfg.stages.map((s) => s.id)];
  let next = 'not_started';
  for (const s of cfg.stages) if (flags[s.flag]) next = s.id;
  return order.indexOf(next) > order.indexOf(previous) ? next : previous;
}
