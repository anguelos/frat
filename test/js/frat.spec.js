const { test, expect } = require('@playwright/test');

// Helper: fetch the list of image IDs from the server
async function getImageIds(request) {
  const resp = await request.get('/page_id_list');
  return resp.json();
}

test.describe('Server API', () => {
  test('index page shows image thumbnails', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible();
    // Each image gets a row with a thumbnail link
    const thumbs = page.locator('img');
    await expect(thumbs).not.toHaveCount(0);
  });

  test('page_id_list returns an array of MD5 strings', async ({ request }) => {
    const ids = await getImageIds(request);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    // IDs are md5 hex strings (32 chars)
    expect(ids[0]).toMatch(/^[a-f0-9]{32}$/);
  });

  test('config endpoint returns valid annotation config', async ({ request }) => {
    const resp = await request.get('/frat_config.json');
    expect(resp.ok()).toBeTruthy();
    const config = await resp.json();
    expect(config).toHaveProperty('class_colors');
    expect(config).toHaveProperty('commands');
    expect(Array.isArray(config.class_colors)).toBe(true);
  });

  test('annotation JSON returns valid structure', async ({ request }) => {
    const ids = await getImageIds(request);
    const resp = await request.get(`/${ids[0]}.json`);
    expect(resp.ok()).toBeTruthy();
    const annotation = await resp.json();
    expect(annotation).toHaveProperty('rect_LTRB');
    expect(annotation).toHaveProperty('rect_classes');
    expect(annotation).toHaveProperty('class_names');
    expect(Array.isArray(annotation.rect_LTRB)).toBe(true);
  });

  test('thumbnail endpoint returns an image', async ({ request }) => {
    const ids = await getImageIds(request);
    const resp = await request.get(`/${ids[0]}.thumb.png`);
    expect(resp.ok()).toBeTruthy();
    expect(resp.headers()['content-type']).toContain('image');
  });

  test('full image endpoint returns an image', async ({ request }) => {
    const ids = await getImageIds(request);
    const resp = await request.get(`/${ids[0]}.png`);
    expect(resp.ok()).toBeTruthy();
    expect(resp.headers()['content-type']).toContain('image');
  });

  test('unknown URL returns 404', async ({ request }) => {
    const resp = await request.get('/nonexistent.html');
    expect(resp.status()).toBe(404);
  });
});

test.describe('Annotation UI', () => {
  test('annotation page loads with canvas', async ({ page, request }) => {
    const ids = await getImageIds(request);
    await page.goto(`/${ids[0]}.html`);
    // Canvas is created dynamically by Canvaces constructor, but starts at size 0
    // until img.onload fires and initialise_from_image() sets its dimensions.
    // Wait for it to have a non-zero size before asserting visibility.
    await page.waitForFunction(() => {
      const c = document.querySelector('canvas');
      return c && c.width > 0 && c.height > 0;
    });
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('annotation page loads frat_gui.js', async ({ page, request }) => {
    const ids = await getImageIds(request);
    // Intercept the JS request
    let jsLoaded = false;
    page.on('response', resp => {
      if (resp.url().includes('frat_gui.js')) jsLoaded = true;
    });
    await page.goto(`/${ids[0]}.html`);
    await page.waitForLoadState('networkidle');
    expect(jsLoaded).toBe(true);
  });

  test('drawing a rectangle creates an annotation', async ({ page, request }) => {
    const ids = await getImageIds(request);
    await page.goto(`/${ids[0]}.html`);

    // Wait for image load (canvas sized) AND cmd_reload() XHR to complete.
    // cmd_reload() fires in img.onload and overwrites rect_LTRB with the saved
    // annotation — if it finishes after our drag, it wipes the new rectangle.
    await page.waitForLoadState('networkidle');

    // cnv_interactive is the topmost canvas (highest z-index) — it owns mouse events
    const canvas = page.locator('canvas').last();
    const box = await canvas.boundingBox();

    // Intercept the PUT triggered by clicking the Save button
    const putPromise = page.waitForRequest(req =>
      req.method() === 'PUT' && req.url().includes('.json')
    , { timeout: 10000 });

    // Draw a rectangle by drag (plain click = mouse_mode "new")
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150, { steps: 10 });
    await page.mouse.up();

    // Save has no keyboard shortcut — click the Save button from the commands bar
    await page.getByRole('button', { name: 'Save' }).click({ force: true });

    const putReq = await putPromise;
    const body = putReq.postDataJSON();
    expect(body).toHaveProperty('rect_LTRB');
    expect(body.rect_LTRB.length).toBeGreaterThan(0);
  });
});
