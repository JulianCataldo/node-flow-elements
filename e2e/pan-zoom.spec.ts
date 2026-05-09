import type { DemoNfWa } from '../src/features/demo-nf-wa.js';
import {
	test,
	expect,
	waitForFlow,
	getFlowState,
	getCanvasBox,
	canvasWrapperHasClass,
	drag,
	TESTBED_URL,
} from './helpers.js';

test.describe('Canvas pan & zoom', () => {
	test('panning the canvas changes offset', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const stateBefore = await getFlowState(page);

		// Use panzoom API directly — mouse-based panning is unreliable when
		// nodes cover most of the canvas (pointer gets captured for node drag).
		await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.canvas.panzoom?.moveBy(-200, -150, false);
		});
		await page.waitForTimeout(300);

		const stateAfter = await getFlowState(page);

		const offsetMoved =
			stateAfter.offsetX !== stateBefore.offsetX ||
			stateAfter.offsetY !== stateBefore.offsetY;
		expect(offsetMoved).toBe(true);
	});

	test('panning sets isDraggingCanvas state', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const box = await getCanvasBox(page);
		const from = { x: box.x + box.width - 40, y: box.y + box.height - 40 };

		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await page.mouse.move(from.x - 50, from.y - 30);
		await page.waitForTimeout(100);

		const isDragging = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.isDraggingCanvas;
		});

		if (isDragging) {
			const hasClass = await canvasWrapperHasClass(page, 'is-dragging');
			expect(hasClass).toBe(true);
		}

		await page.mouse.up();
	});

	test('zooming with mouse wheel changes scale', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const scaleBefore = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.scale;
		});

		const box = await getCanvasBox(page);
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;

		await page.mouse.move(cx, cy);
		await page.mouse.wheel(0, -300);
		await page.waitForTimeout(400);

		const scaleAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.scale;
		});

		expect(scaleAfter).not.toBeCloseTo(scaleBefore, 1);
	});

	test('zoom in then zoom out returns to approximate original scale', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const scaleBefore = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.scale;
		});

		const box = await getCanvasBox(page);
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;

		await page.mouse.move(cx, cy);

		await page.mouse.wheel(0, -200);
		await page.waitForTimeout(200);

		await page.mouse.wheel(0, 200);
		await page.waitForTimeout(200);

		const scaleAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.canvas.scale;
		});

		expect(scaleAfter).toBeCloseTo(scaleBefore, 0);
	});

	test('resetViewport resets scale and offset', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const box = await getCanvasBox(page);
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;

		await page.mouse.move(cx, cy);
		await page.mouse.wheel(0, -300);
		await page.waitForTimeout(200);

		await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.canvas.resetViewport();
		});
		await page.waitForTimeout(300);

		const state = await getFlowState(page);
		expect(state.scale).toBeCloseTo(1, 0);
	});

	test('panning preserves node relative positions', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const posBefore = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const [n0, n1] = demo?.flow.nodes.list;
			return { dx: n0.x - n1.x, dy: n0.y - n1.y };
		});

		const box = await getCanvasBox(page);
		const from = { x: box.x + box.width - 40, y: box.y + box.height - 40 };
		await drag(page, from, { x: from.x - 150, y: from.y - 100 });
		await page.waitForTimeout(200);

		const posAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const [n0, n1] = demo?.flow.nodes.list;
			return { dx: n0.x - n1.x, dy: n0.y - n1.y };
		});

		expect(posAfter.dx).toBeCloseTo(posBefore.dx, 0);
		expect(posAfter.dy).toBeCloseTo(posBefore.dy, 0);
	});
});
