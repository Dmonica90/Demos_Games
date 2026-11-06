import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const PHONE = { width: 390, height: 844 };
const SHOTS = process.env.SHOTS;

async function phone(context: BrowserContext, url: string, name: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize(PHONE);
  await page.goto(url);
  await page.getByLabel('Tu nombre').fill(name);
  await page.getByRole('button', { name: 'Recibir mi personaje' }).click();
  await expect(page.getByTestId('cc-me-num')).toBeVisible();
  return page;
}

const roleOf = async (p: Page) => (await p.locator('#cc-role').textContent())!;

test('menú → Código Clip: registro, perfiles, re-entrada, rescate, votación, venta y cierre', async ({ context }) => {
  const host = await context.newPage();
  await host.setViewportSize({ width: 1440, height: 1000 });
  await host.goto('/?local=1#/');
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/cc-0-menu.png` });
  await host.getByRole('link', { name: /Código Clip/ }).click();

  // Registro: 6 personas → 1 infiltrado; reparto ajustable.
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

  const names = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer'];
  const phones: Page[] = [];
  for (const n of names) phones.push(await phone(context, url, n));
  await expect(host.getByText('6 de 6 registrados')).toBeVisible();
  for (const p of phones) await expect(p.getByRole('listitem').filter({ hasText: /^\d\./ })).toHaveCount(5);
  if (SHOTS) await phones[0].screenshot({ path: `${SHOTS}/cc-2-perfil.png`, fullPage: true });

  // Host sees real names; phones never do.
  await expect(host.getByRole('cell', { name: 'Beto' })).toBeVisible();
  await expect(phones[0].getByText('Beto')).toHaveCount(0);

  // Re-entrada: Ana borra su sesión, vuelve a escanear y recupera su personaje con su nombre.
  const anaRole = await roleOf(phones[0]);
  await phones[0].evaluate(() => sessionStorage.clear());
  await phones[0].reload();
  await phones[0].getByLabel('Tu nombre').fill('ana');
  await phones[0].getByRole('button', { name: 'Recibir mi personaje' }).click();
  await expect(phones[0].getByText('Ya hay alguien llamado “ana” (Jugador 1)')).toBeVisible();
  await phones[0].getByRole('button', { name: 'Sí, recuperar mi personaje' }).click();
  await expect(phones[0].getByTestId('cc-me-num')).toHaveText('Jugador 1');
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
  await expect(beto.getByTestId('cc-points')).toHaveText('3 pts');

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
  const stored = await host.evaluate((c) => localStorage.getItem(`codigo:state:${c}`), code);
  expect(stored).not.toContain('Beto');
});
