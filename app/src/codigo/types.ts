/**
 * Código Clip: the state of one session. The same shapes come back from the
 * Supabase functions (`supabase/migrations/002_codigo_clip.sql`) and from the
 * in-browser backend, which runs `state.ts` on them.
 */
export type RoleId =
  | 'phishing'
  | 'merchant_fan'
  | 'merchant_desconfiado'
  | 'merchant_confuso'
  | 'vendedor_clip'
  | 'vendedor_miclip'
  | 'fan_miclip'
  | 'persona_normal';

export type Group = 'comercio' | 'venta';

/** One card of the deck the host confirms. A phishing card says which group it imitates. */
export type Slot = { role: RoleId; decoy: Group | null };

export type CCStatus = 'registro' | 'jugando' | 'cerrada';

/** The public part of a session: anyone with the code may read it. */
export type CCSession = {
  code: string;
  status: CCStatus;
  /** Participants the host registered (the size of the deck). */
  total: number;
  /** Index into SECTIONS. */
  section: number;
  /** "Ronda de preguntas" open: players ask each other about their pistas. */
  roundOpen: boolean;
  voteRound: number;
  voteOpen: boolean;
  pointsOn: boolean;
  saleOpen: boolean;
  rev: number;
};

export type CCPlayer = {
  id: string;
  /** Public number ("Jugador 7"): what everyone else sees and votes for. */
  num: number;
  /** Real name: only the host sees it, and only until the session closes. */
  name: string;
  role: RoleId;
  decoy: Group | null;
  auditor: boolean;
  /** Barra de vida, 0–100: baja con votos recibidos, se recupera con el rescate. */
  life: number;
  joinedAt: number;
};

export type Vote = { round: number; voterId: string; targetId: string };

export type RescueStatus = 'pendiente' | 'correcta' | 'incorrecta';
export type Rescue = {
  id: string;
  playerId: string;
  section: number;
  /** Auditors answer their own question. */
  auditor: boolean;
  answer: string;
  status: RescueStatus;
  at: number;
};

export type Sale = { id: string; merchantId: string; sellerId: string; criteria: string[]; convinced: boolean; at: number };

export type CCState = {
  session: CCSession;
  slots: Slot[];
  /** Roles for people who arrive after the deck ran out: never phishing. */
  overflow: RoleId[];
  players: CCPlayer[];
  votes: Vote[];
  rescues: Rescue[];
  sales: Sale[];
};

/** What a phone gets back: its own player and only public facts about the rest. */
export type PlayerView = {
  session: CCSession;
  me: CCPlayer;
  roster: { num: number; auditor: boolean; wasPhishing: boolean | null }[];
  /** The number this player voted for in the current round, if any. */
  votedFor: number | null;
  rescues: { section: number; auditor: boolean; status: RescueStatus }[];
  /** As a merchant: the sellers this player already judged. */
  judged: number[];
};

/** What the host gets back: everything, names included. */
export type HostView = {
  session: CCSession;
  players: CCPlayer[];
  votes: Vote[];
  rescues: Rescue[];
  sales: Sale[];
};

/** The public board for the projected screen: names and life, no roles, no votes. */
export type BoardView = {
  session: CCSession;
  players: { num: number; name: string; life: number; auditor: boolean; wasPhishing: boolean | null }[];
  /** How many voted in the current round. */
  voted: number;
};

export type JoinResult = { status: 'ok'; token: string } | { status: 'exists'; num: number };

export type SessionPatch = Partial<Pick<CCSession, 'section' | 'roundOpen' | 'voteOpen' | 'pointsOn' | 'saleOpen'>>;
