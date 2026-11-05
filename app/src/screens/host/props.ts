import type { CaseDef } from '../../cases/types';
import type { Player, Session } from '../../realtime';

export type HostProps = {
  session: Session;
  def: CaseDef;
  players: Player[];
  /** Null when this browser did not create the session: view only. */
  hostKey: string | null;
};
