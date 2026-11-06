import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const PHONE = { width: 390, height: 844 };
const SHOTS = process.env.SHOTS;

async function intro(page: Page) {
  await expect(page.getByText('Gracias por elegirnos')).toBeVisible();
  await page.getByRole('button', { name: /Iniciar/ }).click();
  await expect(page.getByRole('heading', { name: /Cómo se juega/ })).toBeVisible();
  await page.getByRole('button', { name: 'Entendido' }).click();
}

async function phone(context: BrowserContext, url: string, name: string, shot?: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize(PHONE);
  await page.goto(url);
  if (shot) await page.waitForTimeout(3500), await page.screenshot({ path: `${shot}-intro.png` });
  await page.getByRole('button', { name: /Iniciar/ }).click();
  if (shot) await page.screenshot({ path: `${shot}-howto.png`, fullPage: true });
  await page.getByRole('button', { name: 'Entendido' }).click();
  await page.getByLabel('Tu nombre').fill(name);
  await page.getByRole('button', { name: 'Recibir mi personaje' }).click();
  await expect(page.getByTestId('cc-me-num')).toBeVisible();
  await page.getByText('Toca para voltear tu carta').click();
  await expect(page.locator('#cc-role')).toBeVisible();
  return page;
}

const roleOf = async (p: Page) => (await p.locator('#cc-role').textContent())!;

test('menú → Código Clip: registro, perfiles, re-entrada, rescate, votación, venta y cierre', async ({ context }) => {
  test.setTimeout(180_000);
  const host = await context.newPage();
  await host.setViewportSize({ width: 1440, height: 1000 });
  await host.goto('/?local=1#/');
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/cc-0-menu.png` });
  await host.getByRole('link', { name: /Código Clip/ }).click();

  // Registro: mínimo 3; 6 personas → 1 infiltrado; reparto ajustable.
  await host.getByLabel('Participantes').fill('2');
  await expect(host.getByText('Se juega con al menos 3 personas')).toBeVisible();
  await expect(host.getByRole('button', { name: 'Confirmar y repartir roles' })).toBeDisabled();
  await host.getByLabel('Participantes').fill('6');
  await expect(host.getByTestId('count-phishing')).toHaveText('1');
  await expect(host.getByText('Listo: 6 roles para 6 personas.')).toBeVisible();
  await host.getByRole('button', { name: 'Agregar Persona normal' }).click();
  await expect(host.getByRole('button', { name: 'Confirmar y repartir roles' })).toBeDisabled();
  await host.getByRole('button', { name: 'Quitar Persona normal' }).click();
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/cc-1-registro.png`, fullPage: true });
  await host.getByRole('button', { name: 'Confirmar y repartir roles' }).click();

  const code = (await host.getByTestId('cc-code').textContent())!.trim();
  await expect(host.getByTestId('cc-join-link')).toContainText(`#/codigo/jugar/${code}`);
  const url = `/?local=1#/codigo/jugar/${code}`;

  // The projected screen: its own window, no host key.
  const screen = await context.newPage();
  await screen.setViewportSize({ width: 1440, height: 900 });
  await screen.goto(`/?local=1#/codigo/pantalla/${code}`);
  await expect(screen.getByTestId('cc-screen-section')).toHaveText('¿Quiénes somos?');
  await expect(screen.getByRole('img', { name: /Código QR/ })).toBeVisible();

  const names = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer'];
  const phones: Page[] = [];
  for (const [i, n] of names.entries()) phones.push(await phone(context, url, n, i === 0 && SHOTS ? `${SHOTS}/cc-2` : undefined));
  await expect(host.getByText('6 de 6 registrados')).toBeVisible();
  for (const p of phones) await expect(p.locator('#cc-role').locator('xpath=..').getByRole('listitem')).toHaveCount(5);
  for (const p of phones) await expect(p.locator('#cc-role').locator('xpath=..').getByRole('listitem').first()).not.toContainText('?');
  if (SHOTS) await phones[0].screenshot({ path: `${SHOTS}/cc-2-carta.png`, fullPage: true });

  // The "?" button brings the instructions back.
  await phones[0].getByRole('button', { name: 'Cómo se juega' }).click();
  await expect(phones[0].getByRole('heading', { name: /Cómo se juega/ })).toBeVisible();
  await phones[0].getByRole('button', { name: 'Entendido' }).click();

  // The projection ranks everyone at 100 and shows no character names.
  await expect(screen.getByTestId('cc-ranking').getByRole('listitem')).toHaveCount(6);
  await expect(screen.getByTestId('cc-ranking')).toContainText('Beto');
  await expect(screen.getByText(/Merchant|Vendedor|Phishing|Fan de Mi Clip|Persona normal/)).toHaveCount(0);

  // Host control sees names and roles; phones see neither.
  await expect(host.getByRole('cell', { name: 'Beto' })).toBeVisible();
  await expect(phones[0].getByText('Beto')).toHaveCount(0);

  // Re-entrada: Ana borra su sesión, vuelve a escanear y recupera su personaje con su nombre.
  const anaRole = await roleOf(phones[0]);
  await phones[0].evaluate(() => sessionStorage.clear());
  await phones[0].reload();
  await intro(phones[0]);
  await phones[0].getByLabel('Tu nombre').fill('ana');
  await phones[0].getByRole('button', { name: 'Recibir mi personaje' }).click();
  await expect(phones[0].getByText('Ya hay alguien llamado “ana” (Jugador 1)')).toBeVisible();
  await phones[0].getByRole('button', { name: 'Sí, recuperar mi personaje' }).click();
  await expect(phones[0].getByTestId('cc-me-num')).toHaveText('Jugador 1');
  await phones[0].getByText('Toca para voltear tu carta').click();
  expect(await roleOf(phones[0])).toBe(anaRole);

  // Rescate en "¿Quiénes somos?".
  const beto = phones[1];
  await beto.getByRole('button', { name: 'Pedir pregunta rescate' }).click();
  await beto.getByLabel('Tu respuesta').fill('Swap');
  await beto.getByRole('button', { name: 'Enviar respuesta' }).click();
  await expect(beto.getByText('Enviada. El presentador')).toBeVisible();
  await host.getByRole('button', { name: /^Rescates/ }).click();
  await expect(host.getByTestId('cc-rescues')).toContainText('“Swap”');
  await host.getByRole('button', { name: '✓ Correcta' }).click();
  await expect(beto.getByText('✓ ¡Correcta!')).toBeVisible();
  await expect(beto.getByTestId('cc-life')).toHaveAttribute('data-life', '100'); // ya estaba lleno

  // Votación: solo después de la primera plática.
  await expect(host.getByRole('button', { name: 'Abrir votación' })).toBeDisabled();
  await host.getByRole('button', { name: '2. Firma de contrato' }).click();
  await expect(host.getByTestId('cc-section')).toHaveText('Firma de contrato');
  await expect(beto.getByText('Pregunta rescate')).toHaveCount(0); // sin rescate
  await host.getByRole('button', { name: 'Abrir votación' }).click();
  for (const [i, p] of phones.entries()) {
    const target = i === 0 ? 2 : 1; // todos contra el Jugador 1, Ana contra el 2
    await p.getByRole('button', { name: `Votar por el Jugador ${target}`, exact: true }).click();
    await expect(p.getByText(`Votaste por el Jugador ${target}`)).toBeVisible();
  }
  await host.getByRole('button', { name: /^Votos/ }).click();
  await expect(host.getByTestId('cc-votes')).toContainText('Jugador 2 · Beto → Jugador 1 · Ana');
  // 5 votos contra Ana: 100 − 50; Beto recibió 1: 90. La proyección los reordena.
  await expect(screen.getByTestId('cc-ranking').getByRole('listitem').last()).toHaveAttribute('data-life', '50');
  await expect(screen.getByTestId('cc-ranking').getByRole('listitem').last()).toContainText('Ana');
  await expect(phones[0].getByTestId('cc-life')).toHaveAttribute('data-life', '50');
  await expect(screen.getByText(/Votación abierta · 6 de 6 votaron/)).toBeVisible();
  if (SHOTS) await screen.screenshot({ path: `${SHOTS}/cc-4-proyeccion.png` });
  await host.getByRole('button', { name: 'Cerrar votación' }).click();
  await host.getByRole('button', { name: 'Nombrar auditor' }).first().click();
  await expect(phones[0].getByText('ahora eres auditor')).toBeVisible();
  await expect(phones[3].getByText(/Jugador 1: (era phishing|no era phishing)/)).toBeVisible();
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/cc-3-votos.png`, fullPage: true });

  // Venta: el primer merchant califica a alguien.
  await host.getByRole('button', { name: 'Abrir venta' }).click();
  for (const p of phones) await expect(p.getByRole('heading', { name: /Venta abierta|¿Te convencieron\?/ })).toBeVisible();
  let merchant: Page | null = null;
  for (const p of phones) if (await p.getByText('¿Te convencieron?').count()) merchant = p;
  expect(merchant).not.toBeNull();
  const myNum = Number((await merchant!.getByTestId('cc-me-num').textContent())!.replace(/\D/g, ''));
  const other = myNum === 2 ? 3 : 2;
  await merchant!.getByLabel('¿Quién te vendió?').selectOption(String(other));
  await merchant!.getByLabel(/Me dio un dato real/).check();
  await merchant!.getByRole('button', { name: 'Me convenció', exact: true }).click();
  await expect(merchant!.getByText(`Ya calificaste a: Jugador ${other}`)).toBeVisible();
  await host.getByRole('button', { name: /^Venta$/ }).click();
  await expect(host.getByTestId('cc-sales')).toContainText('quedó convencido');

  // Cierre: se borra todo.
  await host.getByRole('button', { name: 'Cerrar sesión y borrar datos' }).click();
  await host.getByRole('button', { name: 'Sí, cerrar y borrar' }).click();
  await expect(host.getByText('Sesión cerrada')).toBeVisible();
  await expect(phones[2].getByText('¡Gracias por jugar!')).toBeVisible();
  await expect(screen.getByText('¡Gracias por jugar!')).toBeVisible();
  const stored = await host.evaluate((c) => localStorage.getItem(`codigo:state:${c}`), code);
  expect(stored).not.toContain('Beto');
});
