const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'http://localhost:8182' });

async function getImageIds(request) {
  const resp = await request.get('http://localhost:8182/page_id_list');
  return resp.json();
}

test.describe('view_only mode', () => {
  test('config reports view_only as true', async ({ request }) => {
    const resp = await request.get('http://localhost:8182/frat_config.json');
    expect(resp.ok()).toBeTruthy();
    const config = await resp.json();
    expect(config.view_only).toBe(true);
  });

  test('PUT annotation is refused with 403', async ({ request }) => {
    const ids = await getImageIds(request);
    const annotation = {
      rect_LTRB: [[10, 10, 100, 100]],
      rect_captions: ['test'],
      rect_classes: [1],
      class_names: ['No Class', 'Textura'],
      class_colors: ['#000000', '#FF0000'],
      image_wh: [800, 600],
    };
    const resp = await request.put(`http://localhost:8182/${ids[0]}.json`, {
      data: JSON.stringify(annotation),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(403);
  });

  test('PUT autosave is refused with 403', async ({ request }) => {
    const ids = await getImageIds(request);
    const annotation = {
      rect_LTRB: [],
      rect_captions: [],
      rect_classes: [],
      class_names: ['No Class'],
      class_colors: ['#000000'],
      image_wh: [800, 600],
    };
    const resp = await request.put(`http://localhost:8182/${ids[0]}.auto.json`, {
      data: JSON.stringify(annotation),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(403);
  });

  test('GET requests still work in view_only mode', async ({ request }) => {
    const ids = await getImageIds(request);
    const resp = await request.get(`http://localhost:8182/${ids[0]}.json`);
    expect(resp.ok()).toBeTruthy();
  });
});

test.describe('view_only UI', () => {
  test('mutating buttons are disabled', async ({ page }) => {
    await page.goto('http://localhost:8182');
    const ids = await (await page.request.get('http://localhost:8182/page_id_list')).json();
    await page.goto(`http://localhost:8182/${ids[0]}.html`);
    await page.waitForLoadState('networkidle');

    for (const name of ['Save', 'Delete', 'Undelete', 'Edit', 'Merge']) {
      const btn = page.getByRole('button', { name, exact: true });
      if (await btn.count() > 0) {
        await expect(btn).toBeDisabled();
      }
    }
  });

  test('drawing a rectangle does not create an annotation', async ({ page }) => {
    const ids = await (await page.request.get('http://localhost:8182/page_id_list')).json();
    await page.goto(`http://localhost:8182/${ids[0]}.html`);
    await page.waitForLoadState('networkidle');

    const before = await (await page.request.get(`http://localhost:8182/${ids[0]}.json`)).json();

    const canvas = page.locator('canvas').last();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150, { steps: 10 });
    await page.mouse.up();

    const after = await (await page.request.get(`http://localhost:8182/${ids[0]}.json`)).json();
    expect(after.rect_LTRB.length).toBe(before.rect_LTRB.length);
  });
});