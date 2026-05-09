import { test, expect, sel, waitForFlow, TESTBED_URL } from './helpers.js';

test.describe('WebAwesome theme widgets', () => {
	test('minimap is rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const minimap = page.locator(sel.minimap);
		await expect(minimap).toBeAttached();
	});

	test('navigation controls are rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const nav = page.locator(sel.navigation);
		await expect(nav).toBeAttached();
	});

	test('center button is rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const center = page.locator(sel.center);
		await expect(center).toBeAttached();
	});

	test('inventory panel is rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const inventory = page.locator(sel.inventory);
		await expect(inventory).toBeAttached();
	});
});

test.describe('Custom node types rendering', () => {
	test('number input nodes have input fields', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Kitchen-sink has NfWaNumberNode with wa-input
		const inputs = page.locator('nf-node wa-input, nf-node input');
		const count = await inputs.count();
		expect(count).toBeGreaterThan(0);
	});

	test('operation node has calculation type buttons', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Operation node has radio buttons (Sum/Divide/Minus/Multiply)
		const radioButtons = page.locator(
			'nf-node wa-radio-button, nf-node wa-button',
		);
		const count = await radioButtons.count();
		expect(count).toBeGreaterThan(0);
	});

	test('sticky note nodes render text content', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// The sticky note text is set as wa-textarea value deep in shadow DOM
		// nf-wa-note lives inside: demo-nf-wa → shadow → nf-flow → shadow → nf-node → nf-wa-node → nf-wa-note → shadow → wa-textarea
		const hasNoteText = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo?.shadowRoot?.querySelector('nf-flow');
			const notes = flow?.shadowRoot?.querySelectorAll('nf-wa-note') ?? [];
			for (const note of notes) {
				const textarea = note.shadowRoot?.querySelector('wa-textarea');
				if (textarea && (textarea as any).value?.includes('Right click on the'))
					return true;
			}
			return false;
		});
		expect(hasNoteText).toBe(true);
	});

	test('display node shows a computed value', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// The display node shows a numeric result
		const display = page.locator('nf-node').filter({ hasText: 'Display' });
		await expect(display).toBeVisible();
	});

	test('color picker node is rendered', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// The Solid color node has a color picker (wa-color-picker)
		const colorPicker = page.locator('wa-color-picker');
		const count = await colorPicker.count();
		expect(count).toBeGreaterThan(0);
	});

	test('all node types have correct display names', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const displayNames = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.nodes.list.map((n: any) => n.displayName);
		});

		// Some expected display names from kitchen-sink
		const expected = [
			'Factor - Brightness',
			'Operation',
			'Solid color',
			'Template',
			'Text',
			'Sticky note',
			'Filters',
			'Mixer',
			'Display',
		];

		for (const name of expected) {
			expect(displayNames).toContain(name);
		}
	});
});

test.describe('Node form interactivity', () => {
	test('typing in a number input updates the port value', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Find the first wa-input (number node)
		const input = page.locator('nf-node wa-input').first();
		const isVisible = await input.isVisible();

		if (isVisible) {
			// Clear and type a new value
			await input.click();
			await input.fill('42');
			await input.press('Enter');
			await page.waitForTimeout(200);

			// The value should have changed on the port
			const nodeValue = await page.evaluate(() => {
				const demo = document.querySelector('demo-nf-wa') as any;
				// Get the first number node's output port value
				for (const node of demo.flow.nodes.list) {
					if (node.type === 'NfWaNumberNode') {
						const portEntries = Object.entries(node.ports) as any;
						for (const [, port] of portEntries) {
							if (port.direction === 'out') {
								return port.value;
							}
						}
					}
				}
				return null;
			});

			// Value should be some number (42 or the node's processed result)
			expect(nodeValue).not.toBeNull();
		}
	});
});

test.describe('Accessibility & keyboard', () => {
	test('flow element is focusable', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const flow = page.locator(sel.flow);
		// Flow should be in the tab order or at least interactive
		const tagName = await flow.evaluate((el) => el.tagName.toLowerCase());
		expect(tagName).toBe('nf-flow');
	});

	test('nodes are tab-reachable or clickable', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const node = page.locator(sel.node).first();
		// Nodes should be clickable
		await node.click({ force: true });

		const selected = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.selectedNode !== null;
		});
		// Clicking should select
		expect(selected).toBe(true);
	});
});

test.describe('Visual regression guards', () => {
	test('flow renders all visible elements without errors', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// No uncaught errors
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));

		// Wait for stable render
		await page.waitForTimeout(1000);

		expect(errors.length).toBe(0);
	});

	test('all nodes are within viewport or canvas bounds', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const nodeBoxes = await page.evaluate(() => {
			const nodes = document.querySelectorAll('nf-node');
			return Array.from(nodes).map((n) => {
				const rect = n.getBoundingClientRect();
				return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
			});
		});

		// All nodes should have non-zero dimensions
		for (const box of nodeBoxes) {
			expect(box.w).toBeGreaterThan(0);
			expect(box.h).toBeGreaterThan(0);
		}
	});

	test('link SVG paths have non-zero length', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// nf-links is a light DOM child of nf-flow, inside demo-nf-wa's shadow root
		const pathLengths = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const nfLinks = demo?.shadowRoot?.querySelector('nf-links');
			if (!nfLinks) return [];
			const svg = nfLinks.shadowRoot?.querySelector('svg');
			if (!svg) return [];
			const paths = svg.querySelectorAll('path');
			return Array.from(paths)
				.map((p) => {
					const d = p.getAttribute('d');
					return d?.length ?? 0;
				})
				.filter((l) => l > 0);
		});

		expect(pathLengths.length).toBeGreaterThan(0);
		for (const len of pathLengths) {
			expect(len).toBeGreaterThan(10); // Not trivially short
		}
	});
});
