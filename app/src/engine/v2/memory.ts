import type { Analysis, Memory, TaskStatus } from './types';

export function emptyMemory(): Memory {
  return {
    urgency_explained: false,
    impact_explained: false,
    empathy_shown: false,
    request_clarity: false,
    partial_delivery_proposed: false,
    deadline_defined: false,
    responsibility_confirmed: false,
    agreement_reached: false,
    asked_topics: [],
    ask_count: {},
    used_responses: [],
    pending_offer: null,
    slots: {},
  };
}

/**
 * Folds one message into what the character remembers. Facts only accumulate:
 * once the urgency is explained it stays explained. A short "yes" accepts
 * whatever the character offered on the previous turn.
 */
export function updateMemory(memory: Memory, a: Analysis, hostile: boolean): Memory {
  const s = a.signals;
  const m: Memory = { ...memory, slots: { ...memory.slots } };
  // Facts said while insulting still count as said, but goodwill does not.
  if (s.urgency) m.urgency_explained = true;
  if (s.impact) m.impact_explained = true;
  if (s.empathy && !hostile && !s.blame) m.empathy_shown = true;
  if (s.request === 1) m.request_clarity = true;
  if (a.deliverable && s.request === 1) m.slots.deliverable = a.deliverable;
  if (s.partial) {
    m.partial_delivery_proposed = true;
    m.slots.partial = a.partial;
  }
  if (a.deadline) {
    m.deadline_defined = true;
    m.slots.deadline = a.deadline;
  }
  if (a.partialWhen) m.slots.partialWhen = a.partialWhen;
  if (s.responsibility) m.responsibility_confirmed = true;

  // A yes (or an explicit agreement) accepts the offer on the table.
  const accepts = (s.affirm || s.agreement || s.gratitude) && !s.blame && !hostile;
  if (accepts && m.pending_offer === 'partial') m.partial_delivery_proposed = true;
  if (accepts && m.pending_offer === 'deadline') m.deadline_defined = true;
  if (accepts && m.pending_offer === 'confirm') {
    m.responsibility_confirmed = true;
    m.agreement_reached = true;
  }
  return m;
}

export function taskStatus(m: Memory, previous: TaskStatus): TaskStatus {
  const order: TaskStatus[] = ['not_started', 'need_clarified', 'partial_offer', 'timeline_proposed', 'agreement'];
  let next: TaskStatus = 'not_started';
  if (m.request_clarity) next = 'need_clarified';
  if (m.partial_delivery_proposed) next = 'partial_offer';
  if (m.deadline_defined) next = 'timeline_proposed';
  if (m.agreement_reached) next = 'agreement';
  // The task only moves forward.
  return order.indexOf(next) > order.indexOf(previous) ? next : previous;
}
