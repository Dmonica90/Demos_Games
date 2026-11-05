import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const PHONE = { width: 390, height: 844 };
const SHOTS = process.env.SHOTS;

async function phone(context: BrowserContext, url: string, nickname: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize(PHONE);
  await page.goto(url);
  await page.getByLabel('Tu nombre o nickname').fill(nickname);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Ya estás en la sala')).toBeVisible();
  return page;
}

async function say(page: Page, text: string) {
  await page.getByLabel('Tu respuesta').fill(text);
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByLabel('Tu respuesta')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled(); // empty again, answer arrived
}

test('una sesión completa: QR, sala, conversación, dashboard y ranking', async ({ context }) => {
  const host = await context.newPage();
  await host.setViewportSize({ width: 1440, height: 900 });
  await host.goto('/?local=1&fast=1#/');
  await host.getByText('La entrega pendiente').click();
  await host.getByRole('button', { name: 'Crear sesión y mostrar QR' }).click();

  const code = (await host.getByTestId('session-code').textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{5}$/);
  await expect(host.getByRole('img', { name: /Código QR/ })).toBeVisible();
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/1-host-lobby.png` });

  // The QR encodes this URL; the phones open it.
  const url = `/?local=1&fast=1#/jugar/${code}`;
  const ana = await phone(context, url, 'Ana');
  const beto = await phone(context, url, 'Beto');
  const caro = await phone(context, url, 'Caro');
  await expect(host.getByText('3 conectados')).toBeVisible();
  if (SHOTS) await ana.screenshot({ path: `${SHOTS}/2-phone-waiting.png` });

  await host.getByRole('button', { name: 'Iniciar actividad' }).click();
  for (const p of [ana, beto, caro]) await expect(p.getByText('No he podido terminar la información')).toBeVisible();

  // Ana: clear, empathetic, assertive; Daniel sums up the plan and she confirms.
  await say(
    ana,
    'Entiendo que estés saturado. Para cerrar el proyecto necesito los datos de ventas. ¿Puedes enviarme lo que ya está validado hoy y completar el resto mañana a las 11?',
  );
  await expect(ana.getByText('Entonces quedamos así')).toBeVisible();
  await say(ana, 'Sí, perfecto, gracias.');
  await expect(ana.getByText('¡Misión cumplida')).toBeVisible();
  await expect(ana.getByTestId('quadrant')).toContainText('Misión resuelta eficazmente');
  if (SHOTS) await ana.screenshot({ path: `${SHOTS}/4-phone-done.png`, fullPage: true });

  // Beto: vague, then recovers into yellow.
  await say(beto, 'Ok, cuando puedas.');
  await expect(beto.getByTestId('my-color')).toHaveAttribute('data-color', 'yellow');

  // Caro: blames twice and goes red.
  await say(caro, 'Otra vez lo mismo, siempre llegas tarde con todo.');
  await say(caro, 'No puede ser, es tu responsabilidad, sin excusas.');
  await expect(caro.getByTestId('my-color')).toHaveAttribute('data-color', 'red');
  if (SHOTS) await caro.screenshot({ path: `${SHOTS}/3-phone-chat.png` });

  await expect(host.getByTestId('row-Ana')).toHaveAttribute('data-color', 'green');
  await expect(host.getByTestId('row-Beto')).toHaveAttribute('data-color', 'yellow');
  await expect(host.getByTestId('row-Caro')).toHaveAttribute('data-color', 'red');
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/5-host-dashboard.png` });

  await host.getByRole('button', { name: 'Terminar y ver resultados' }).click();
  const ranking = host.getByRole('list', { name: 'Ranking' }).getByRole('listitem');
  await expect(ranking).toHaveCount(3);
  await expect(ranking.nth(0)).toContainText('Ana');
  await expect(ranking.nth(2)).toContainText('Caro');
  await expect(host.getByText('Culpa o reclama')).toBeVisible();
  if (SHOTS) await host.screenshot({ path: `${SHOTS}/6-host-results.png`, fullPage: true });

  // The others' phones close when the host ends the activity.
  await expect(beto.getByText('Conversación terminada')).toBeVisible();
});

test('un celular sin código puede escribirlo', async ({ page }) => {
  await page.goto('/?local=1#/jugar');
  await page.getByLabel('Código de la sesión').fill('zzzzz');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Código no válido')).toBeVisible();
});

test('el laboratorio muestra la memoria del motor', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?local=1#/laboratorio');
  await page.getByRole('button', { name: 'Empática y concreta' }).click();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('[data-memory="impact_explained"]')).toHaveAttribute('data-on', 'true');
  await expect(page.locator('[data-memory="deadline_defined"]')).toHaveAttribute('data-on', 'true');
  await expect(page.locator('[data-memory="agreement_reached"]')).toHaveAttribute('data-on', 'false');
  await page.getByLabel('Mensaje').fill('Sí, perfecto, gracias.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('[data-memory="agreement_reached"]')).toHaveAttribute('data-on', 'true');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/7-laboratorio.png`, fullPage: true });
});
