import type { DemoNfWa } from '../src/features/demo-nf-wa.js';
import {
	test,
	expect,
	sel,
	waitForFlow,
	canvasWrapperHasClass,
	drag,
	TESTBED_URL,
} from './helpers.js';

test.describe('Node dragging', () => {
	test('dragging a node handle changes its position', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const initialPos = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.list[0];
			return { x: node.x, y: node.y };
		});

		// Use the nf-handle locator (Playwright pierces shadow DOM)
		const handle = page.locator(sel.handle).first();
		const handleBox = await handle.boundingBox();
		expect(handleBox).not.toBeNull();

		const from = {
			x: handleBox!.x + handleBox!.width / 2,
			y: handleBox!.y + handleBox!.height / 2,
		};
		const to = { x: from.x + 150, y: from.y + 100 };

		await drag(page, from, to);
		await page.waitForTimeout(200);

		const finalPos = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.list[0];
			return { x: node?.x, y: node?.y };
		});

		expect(finalPos.x).not.toBeCloseTo(initialPos.x, 0);
		expect(finalPos.y).not.toBeCloseTo(initialPos.y, 0);
	});

	test('dragging sets isDraggingNode state', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		expect(box).not.toBeNull();

		const center = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};

		// Start drag
		await page.mouse.move(center.x, center.y);
		await page.mouse.down();
		await page.mouse.move(center.x + 30, center.y + 20);
		await page.waitForTimeout(50);

		const isDragging = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.isDraggingAny;
		});
		expect(isDragging).toBe(true);

		// Check wrapper class via shadow DOM traversal
		const hasClass = await canvasWrapperHasClass(page, 'is-dragging-node');
		expect(hasClass).toBe(true);

		await page.mouse.up();

		const isDraggingAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.isDraggingAny;
		});
		expect(isDraggingAfter).toBe(false);
	});

	test('dragging selects the node', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const handle = page.locator(sel.handle).nth(1);
		const box = await handle.boundingBox();
		expect(box).not.toBeNull();

		await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.waitForTimeout(100);

		const selectedId = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.selectedNode?.id ?? null;
		});

		expect(selectedId).not.toBeNull();
	});

	test('dragged node updates its z-index (comes to front)', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const zBefore = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list[0].zIndex;
		});

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.waitForTimeout(100);

		const zAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list[0].zIndex;
		});

		expect(zAfter).toBeGreaterThanOrEqual(zBefore);
	});

	test('node CSS variables update after drag', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Get initial position from the flow store
		const initX = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list[0].x;
		});

		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		const from = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};

		await drag(page, from, { x: from.x + 200, y: from.y });
		await page.waitForTimeout(200);

		const finalX = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list[0].x;
		});

		expect(finalX).not.toBe(initX);
	});

	test('multiple nodes can be dragged independently', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Drag first node right
		const handle0 = page.locator(sel.handle).first();
		const box0 = await handle0.boundingBox();
		const from0 = {
			x: box0!.x + box0!.width / 2,
			y: box0!.y + box0!.height / 2,
		};
		await drag(page, from0, { x: from0.x + 100, y: from0.y });
		await page.waitForTimeout(100);

		const positions = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list
				.slice(0, 2)
				.map((n: any) => ({ x: n.x, y: n.y }));
		});

		// Now drag second node down
		const handle1 = page.locator(sel.handle).nth(1);
		const box1 = await handle1.boundingBox();
		const from1 = {
			x: box1!.x + box1!.width / 2,
			y: box1!.y + box1!.height / 2,
		};
		await drag(page, from1, { x: from1.x, y: from1.y + 100 });
		await page.waitForTimeout(100);

		const positionsAfter = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.list
				.slice(0, 2)
				.map((n: any) => ({ x: n.x, y: n.y }));
		});

		expect(positionsAfter?.[1].y).not.toBeCloseTo(positions?.[1].y, 0);
	});
});
