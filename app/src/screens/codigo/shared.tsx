import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { Color } from '../../engine/conversation';
import { ccJoinUrl } from '../../router';

/** Life bar colour: the same three states as the simulator's bar. */
export const lifeColor = (life: number): Color => (life >= 70 ? 'green' : life >= 40 ? 'yellow' : 'red');

/** The QR, dressed as the back of a board-game card. */
export function QrCard({ code, compact = false }: { code: string; compact?: boolean }) {
  const url = ccJoinUrl(code);
  const [svg, setSvg] = useState('');
  useEffect(() => {
    void QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c2230', light: '#ffffff' } }).then(setSvg);
  }, [url]);
  return (
    <div className="rounded-[1.75rem] bg-brand p-2.5 shadow-brand">
      <div className="flex flex-col items-center rounded-[1.35rem] border-4 border-white/70 bg-panel px-5 py-5 text-center">
        <p className="eyebrow">Código Clip · carta de juego</p>
        <p className="mt-1 text-xl font-extrabold text-ink">Escanea y recibe tu carta 🃏</p>
        <div
          className={`mt-3 w-full [&>svg]:h-auto [&>svg]:w-full ${compact ? 'max-w-[11rem]' : 'max-w-[17rem]'}`}
          role="img"
          aria-label={`Código QR para entrar a la sesión ${code}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p data-testid="cc-join-link" className="mt-3 rounded-full bg-panel-2 px-3 py-1 font-mono text-xs break-all text-ink">
          {url.replace(/^https?:\/\//, '')}
        </p>
        <p data-testid="cc-code" className="text-brand mt-2 text-4xl font-extrabold tracking-[0.18em]">
          {code}
        </p>
      </div>
    </div>
  );
}
