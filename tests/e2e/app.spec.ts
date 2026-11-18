import { expect, test, type Page } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };

async function start(page: Page) {
  await page.goto('./');
  const overlay = page.getByTestId('start-overlay');
  await expect(overlay).toBeVisible();
  await overlay.click();
  await expect(overlay).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-audio', 'running', { timeout: 10_000 });
}

test('loads with PWA metadata and version', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle(/kkey/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest\.webmanifest/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    'content',
    'yes',
  );
  await expect(page.getByTestId('version')).toHaveText(`v${pkg.version}`);
  await expect(page.getByTestId('start-overlay')).toContainText('Başlamak için dokun');

  const res = await page.request.get('manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.start_url).toBe('/kkey/');
  expect(manifest.orientation).toBe('landscape');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  expect((await page.request.get('icons/apple-touch-icon.png')).ok()).toBe(true);
  expect((await page.request.get('sw.js')).ok()).toBe(true);
});

test('tap to start unlocks audio and keys respond to touch/pointer', async ({ page }) => {
  await start(page);
  const key = page.locator('.key[data-offset="0"]');
  const box = await key.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height * 0.85;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(key).toHaveClass(/down/);
  // Glissando: slide to the next white key.
  const next = page.locator('.key[data-offset="2"]');
  const nb = (await next.boundingBox())!;
  await page.mouse.move(nb.x + nb.width / 2, y, { steps: 4 });
  await expect(next).toHaveClass(/down/);
  await expect(key).not.toHaveClass(/down/);
  await page.mouse.up();
  await expect(next).not.toHaveClass(/down/);
});

test('makam preset fills the detune bar and can be adjusted', async ({ page }) => {
  await start(page);
  await page.getByTestId('makam').selectOption('rast');
  await expect(page.getByTestId('tonic')).toHaveValue('0');
  // Rast on C: segah (E) is 17 commas ≈ 385 cents → −15.
  await expect(page.getByTestId('dt-val-4')).toHaveText('−15');
  await page.getByTestId('dt-up-4').click();
  await expect(page.getByTestId('dt-val-4')).toHaveText('+8');
  await page.getByTestId('detune-reset').click();
  await expect(page.getByTestId('dt-val-4')).toHaveText('−15');
  await page.getByTestId('makam').selectOption('duz');
  for (let pc = 0; pc < 12; pc++) await expect(page.getByTestId(`dt-val-${pc}`)).toHaveText('0');
});

test('rhythm starts, fills and stops', async ({ page }) => {
  await start(page);
  await page.getByTestId('usul').selectOption('karsilama');
  await expect(page.getByTestId('tempo')).toHaveText('130');
  const play = page.getByTestId('play');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('fill').click();
  await page.waitForTimeout(300);
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
});

test('every instrument plays without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  const voices = await page
    .getByTestId('voice')
    .locator('option')
    .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  expect(voices).toHaveLength(7);
  const box = (await page.locator('.key[data-offset="9"]').boundingBox())!;
  for (const v of voices) {
    await page.getByTestId('voice').selectOption(v);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.85);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
  }
  expect(errors).toEqual([]);
});

test('language switch translates the UI', async ({ page }) => {
  await start(page);
  await page.getByTestId('lang').selectOption('en');
  await expect(page.getByTestId('play')).toContainText('Start');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByTestId('lang').selectOption('ku');
  await expect(page.getByTestId('play')).toContainText('Dest pê bike');
  // Persisted across reloads.
  await page.reload();
  await expect(page.getByTestId('start-overlay')).toContainText('Ji bo destpêkê bitikîne');
});

test('octave shift changes key labels', async ({ page }, info) => {
  test.skip(info.project.name === 'iphone', 'labels hidden in compact phone layout');
  await start(page);
  await expect(page.locator('.key[data-offset="0"] .name')).toHaveText('Do4');
  await page.getByTestId('oct-up').click();
  await expect(page.locator('.key[data-offset="0"] .name')).toHaveText('Do5');
});

test('multi-touch: independent pointers hold a chord', async ({ page }) => {
  await start(page);
  const center = async (off: number) => {
    const b = (await page.locator(`.key[data-offset="${off}"]`).boundingBox())!;
    return { clientX: b.x + b.width / 2, clientY: b.y + b.height * 0.85 };
  };
  const kb = page.getByTestId('keyboard');
  const opts = { bubbles: true, isPrimary: false, pointerType: 'touch' };
  await kb.dispatchEvent('pointerdown', { ...opts, pointerId: 11, ...(await center(0)) });
  await kb.dispatchEvent('pointerdown', { ...opts, pointerId: 12, ...(await center(4)) });
  await kb.dispatchEvent('pointerdown', { ...opts, pointerId: 13, ...(await center(7)) });
  for (const off of [0, 4, 7])
    await expect(page.locator(`.key[data-offset="${off}"]`)).toHaveClass(/down/);
  await kb.dispatchEvent('pointerup', { ...opts, pointerId: 12, ...(await center(4)) });
  await expect(page.locator('.key[data-offset="4"]')).not.toHaveClass(/down/);
  await expect(page.locator('.key[data-offset="0"]')).toHaveClass(/down/);
  await expect(page.locator('.key[data-offset="7"]')).toHaveClass(/down/);
});
