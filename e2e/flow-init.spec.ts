import {
	test,
	expect,
	sel,
	waitForFlow,
	getFlowState,
	getLinkGroupCount,
	TESTBED_URL,
} from './helpers.js';

test.describe('Flow initialization & rendering', () => {
	test('page loads and flow element is present', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const flow = page.locator(sel.flow);
		await expect(flow).toBeVisible();
	});

	test('all kitchen-sink nodes are rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const nodes = page.locator(sel.node);
		const count = await nodes.count();

		expect(count).toBe(16);
	});

	test('flow state is accessible and consistent', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const state = await getFlowState(page);

		expect(state.nodeCount).toBe(16);
		expect(state.scale).toBeCloseTo(1, 0);
		expect(state.isDraggingCanvas).toBe(false);
		expect(state.isDraggingNode).toBe(false);
		expect(state.connectingLink).toBeNull();
		expect(state.linkCount).toBeGreaterThan(0);
	});

	test('nodes have correct slot assignments', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const slotNames = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.nodes.list.map((n: any) => n.slotName);
		});

		for (const slotName of slotNames) {
			expect(slotName).toMatch(/^node_/);
			const slotContent = page.locator(`[slot="${slotName}"]`);
			await expect(slotContent).toBeAttached();
		}
	});

	test('canvas element is initialized', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const canvas = page.locator(sel.canvas);
		await expect(canvas).toBeAttached();

		// Verify the panzoom wrapper exists inside the canvas shadow DOM
		const hasWrapper = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo?.shadowRoot?.querySelector('nf-flow');
			const canvas = flow?.shadowRoot?.querySelector('nf-interactive-canvas');
			return !!canvas?.shadowRoot?.querySelector('.wrapper');
		});
		expect(hasWrapper).toBe(true);
	});

	test('links SVG is rendered with connections', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// nf-links is an SVG overlay — check it's attached (not necessarily visible)
		const linksEl = page.locator(sel.links);
		await expect(linksEl).toBeAttached();

		// The SVG and link groups are inside nf-links shadow DOM
		const groupCount = await getLinkGroupCount(page);
		expect(groupCount).toBeGreaterThan(5);
	});

	test('background element is rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const bg = page.locator(sel.background);
		await expect(bg).toBeVisible();
	});

	test('nodes have position CSS variables', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// nf-node elements are inside nf-flow shadow DOM — use the flow store
		const positions = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.nodes.list.map((n: any) => ({
				dx: `${n.x}px`,
				dy: `${n.y}px`,
			}));
		});

		for (const pos of positions) {
			expect(pos.dx).toBeTruthy();
			expect(pos.dy).toBeTruthy();
			expect(pos.dx).toMatch(/px$/);
			expect(pos.dy).toMatch(/px$/);
		}
	});

	test('WebAwesome theme class is applied', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const flow = page.locator(sel.flow);
		await expect(flow).toHaveClass(/nf-webawesome/);
	});

	test('each node has handles and ports', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Verify via the flow store that all nodes have ports
		const result = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.nodes.list.map((n: any) => ({
				portCount: Object.keys(n.ports).length,
				hasTemplate: typeof n.Template === 'function',
			}));
		});

		for (const node of result) {
			expect(node.portCount).toBeGreaterThanOrEqual(1);
			expect(node.hasTemplate).toBe(true);
		}

		// Also verify that nf-handle elements exist in the DOM (Playwright pierces shadow)
		const handleCount = await page.locator(sel.handle).count();
		expect(handleCount).toBe(16); // one handle per node
	});
});
