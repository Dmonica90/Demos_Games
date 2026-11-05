import { entrega } from './entrega';
import { mejorar } from './mejorar';
import type { CaseDef, CaseId } from './types';
import { urgente } from './urgente';

export const CASES: CaseDef[] = [entrega, urgente, mejorar];

export const CASE_BY_ID: Record<CaseId, CaseDef> = { entrega, urgente, mejorar };

export const isCaseId = (id: string): id is CaseId => id in CASE_BY_ID;
