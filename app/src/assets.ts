/** Interface sounds in `public/assets/audio`. */
const audio = (name: string) => `${import.meta.env.BASE_URL}assets/audio/${name}`;

export const SFX = {
  click: audio('ui-click.mp3'),
  select: audio('ui-select.mp3'),
  open: audio('ui-open.mp3'),
  confirm: audio('ui-confirm.mp3'),
  /** A message from the other person arrives. */
  notification: audio('sfx-notification.mp3'),
  /** The communication bar drops a colour. */
  alert: audio('sfx-alert.mp3'),
} as const;

export type SfxName = keyof typeof SFX;
