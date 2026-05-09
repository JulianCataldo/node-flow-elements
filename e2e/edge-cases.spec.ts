import type { DemoNfWa } from '../demo/features/demo-nf-wa.js';
import {
	test,
	expect,
	sel,
	waitForFlow,
	drag,
	getFlowState,
	getCanvasBox,
	TESTBED_URL,
} from './helpers.js';

test.describe('Edge cases & stress', () => {
	test('rapid successive drags do not corrupt state', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		const center = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};

		for (let i = 0; i < 5; i++) {
			await drag(
				page,
				center,
				{ x: center.x + (i + 1) * 20, y: center.y + 10 },
				3,
			);
		}

		await page.waitForTimeout(200);

		const state = await getFlowState(page);
		expect(state.nodeCount).toBe(16);
		expect(state.isDraggingNode).toBe(false);
		expect(state.isDraggingCanvas).toBe(false);
	});

	test('zoom to minimum and back maintains nodes', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const box = await getCanvasBox(page);
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;

		await page.mouse.move(cx, cy);

		for (let i = 0; i < 10; i++) {
			await page.mouse.wheel(0, 500);
		}
		await page.waitForTimeout(300);

		const scaleMin = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.scale;
		});
		expect(scaleMin).toBeGreaterThanOrEqual(0.04);

		for (let i = 0; i < 10; i++) {
			await page.mouse.wheel(0, -500);
		}
		await page.waitForTimeout(300);

		const state = await getFlowState(page);
		expect(state.nodeCount).toBe(16);
	});

	test('drag node beyond canvas edges does not crash', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		const from = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};

		await drag(page, from, { x: 2000, y: 2000 }, 5);
		await page.waitForTimeout(200);

		const state = await getFlowState(page);
		expect(state.nodeCount).toBe(16);
		expect(state.isDraggingNode).toBe(false);
	});

	test('multiple simultaneous pointer downs are handled', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();

		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.up();
		await page.mouse.down();
		await page.mouse.up();

		const state = await getFlowState(page);
		expect(state.isDraggingNode).toBe(false);
	});

	test('page reload preserves nothing (stateless)', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.nodes.list[0].updatePosition({ x: 9999, y: 9999 });
		});

		await page.reload();
		await waitForFlow(page);

		const pos = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return { x: demo?.flow.nodes.list[0].x, y: demo?.flow.nodes.list[0].y };
		});

		expect(pos.x).not.toBe(9999);
		expect(pos.y).not.toBe(9999);
	});
});

test.describe('Concurrent interactions', () => {
	test('panning canvas then immediately dragging a node', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const box = await getCanvasBox(page);

		// Pan first — use bottom-right area (less likely to hit a node)
		const panFrom = { x: box.x + box.width - 40, y: box.y + box.height - 40 };
		await drag(page, panFrom, { x: panFrom.x - 100, y: panFrom.y - 80 });
		await page.waitForTimeout(200);

		// Then drag a node
		const handle = page.locator(sel.handle).first();
		const hBox = await handle.boundingBox();
		if (hBox) {
			const from = {
				x: hBox.x + hBox.width / 2,
				y: hBox.y + hBox.height / 2,
			};
			await drag(page, from, { x: from.x + 80, y: from.y + 40 });
		}
		await page.waitForTimeout(200);

		const state = await getFlowState(page);
		expect(state.isDraggingNode).toBe(false);
		expect(state.isDraggingCanvas).toBe(false);
		expect(state.nodeCount).toBe(16);
	});

	// FIXME: Not _blocking_ per se, but could provoke side effects.
	// test('connecting port then clicking elsewhere cancels connection', async ({
	//   page,
	// }) => {
	//   await page.goto(TESTBED_URL);
	//   await waitForFlow(page);

	//   const port = page.locator(sel.port).first();
	//   const pBox = await port.boundingBox();
	//   if (!pBox) return;

	//   const portCenter = {
	//     x: pBox.x + pBox.width / 2,
	//     y: pBox.y + pBox.height / 2,
	//   };

	//   await page.mouse.move(portCenter.x, portCenter.y);
	//   await page.mouse.down();
	//   await page.mouse.move(portCenter.x + 200, portCenter.y + 200);

	//   await page.mouse.up();
	//   await page.waitForTimeout(200);

	//   const connecting = await page.evaluate(() => {
	//     const demo = document.querySelector<DemoNfWa>('demo-nf-wa') ;
	//     return demo?.flow.links.connecting;
	//   });
	//   expect(connecting).toBeNull();
	// });

	test('re-clicking port after cancelled connection does not show stale cable', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const port = page.locator(sel.port).first();
		const pBox = await port.boundingBox();
		if (!pBox) return;

		const portCenter = {
			x: pBox.x + pBox.width / 2,
			y: pBox.y + pBox.height / 2,
		};

		// First connection: drag away then release
		await page.mouse.move(portCenter.x, portCenter.y);
		await page.mouse.down();
		await page.mouse.move(portCenter.x + 300, portCenter.y + 300);
		await page.mouse.up();
		await page.waitForTimeout(200);

		// Second connection: click same port again without moving
		await page.mouse.move(portCenter.x, portCenter.y);
		await page.mouse.down();
		await page.waitForTimeout(50);

		const link = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const cl = demo?.flow.links.connecting;
			if (!cl) return null;
			return {
				mouseX: demo?.flow.canvas.mouseX,
				mouseY: demo?.flow.canvas.mouseY,
				fromX: cl.from.x,
				fromY: cl.from.y,
			};
		});

		// Mouse position should be near the port, not at the old +300,+300 offset
		if (link?.mouseX && link?.mouseY) {
			const dx = Math.abs(link.mouseX - link.fromX);
			const dy = Math.abs(link.mouseY - link.fromY);
			expect(dx).toBeLessThan(200);
			expect(dy).toBeLessThan(200);
		}

		await page.mouse.up();
	});
});

test.describe('Flow signals reactivity', () => {
	test('scale signal updates on zoom', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const scaleBefore = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.$scale.get();
		});

		const box = await getCanvasBox(page);
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.wheel(0, -200);
		await page.waitForTimeout(300);

		const scaleAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.$scale.get();
		});

		expect(scaleAfter).not.toBe(scaleBefore);
	});

	test('nodes signal returns all nodes array', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const result = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const fromGetter = demo?.flow.nodes.list.length;
			const fromSignal = demo?.flow.nodes.$list.get().length;
			return { fromGetter, fromSignal };
		});

		expect(result.fromGetter).toBe(16);
		expect(result.fromSignal).toBe(16);
		expect(result.fromGetter).toBe(result.fromSignal);
	});

	test('selectedNode signal updates on click', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const before = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.$selectedNode.get()?.id ?? null;
		});

		const handle = page.locator(sel.handle).nth(3);
		const box = await handle.boundingBox();
		if (box) {
			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
			await page.waitForTimeout(100);
		}

		const after = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.$selectedNode.get()?.id ?? null;
		});

		expect(after).not.toBeNull();
		if (before === null) {
			expect(after).not.toBeNull();
		}
	});
});
