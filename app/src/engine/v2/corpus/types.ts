import type { CaseId } from '../../../cases/types';

/**
 * A phrasing a participant could plausibly write, and the intention the
 * analyzer should find in it (any one of `expect`). `not` lists signals that
 * must not appear (a proposal must not read as a closing, and so on).
 */
export type Sample = { text: string; expect: string[]; not?: string[] };
export type Corpus = Record<CaseId, Record<string, Sample[]>>;
