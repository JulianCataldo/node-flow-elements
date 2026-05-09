import type { DemoNfWa } from '../src/features/demo-nf-wa.js';
import {
	test,
	expect,
	sel,
	waitForFlow,
	getFlowState,
	TESTBED_URL,
} from './helpers.js';

test.describe('Node selection & state', () => {
	test('clicking a node selects it', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Click on the first node
		const node = page.locator(sel.node).first();
		await node.click();
		await page.waitForTimeout(100);

		const state = await getFlowState(page);
		expect(state.selectedNodeId).not.toBeNull();
	});

	test('clicking different nodes changes selection', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Click first node
		const node0 = page.locator(sel.node).first();
		await node0.click();
		await page.waitForTimeout(100);

		const id0 = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.selectedNode?.id;
		});

		// Click second node
		const node1 = page.locator(sel.node).nth(1);
		await node1.click();
		await page.waitForTimeout(100);

		const id1 = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			return demo?.flow.nodes.selectedNode?.id;
		});

		if (id0 && id1) {
			expect(id0).not.toBe(id1);
		}
	});

	test('selected node gets highest z-index', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Click node at index 2
		const node = page.locator(sel.node).nth(2);
		await node.click();
		await page.waitForTimeout(100);

		const zIndexes = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const selected = demo?.flow.nodes.selectedNode;
			const allZ = demo?.flow.nodes.list.map((n: any) => n.zIndex);
			return { selectedZ: selected?.zIndex ?? 0, allZ };
		});

		const maxZ = Math.max(...zIndexes.allZ);
		expect(zIndexes.selectedZ).toBe(maxZ);
	});
});

test.describe('Imperative API', () => {
	test('addNode creates a new node and it appears in DOM', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const countBefore = await page.locator(sel.node).count();

		await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.nodes.add({ type: 'NfWaNoteNode', x: 0, y: 0 });
		});
		await page.waitForTimeout(500);

		const countAfter = await page.locator(sel.node).count();
		expect(countAfter).toBe(countBefore + 1);

		// Flow state count should also increase
		const state = await getFlowState(page);
		expect(state.nodeCount).toBe(countBefore + 1);
	});

	test('addNode with position and avoidOverlap:false places it exactly', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const newNodeId = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.add(
				{ type: 'NfWaNoteNode', x: 500, y: 300 },
				{ avoidOverlap: false },
			);
			return node.id;
		});
		await page.waitForTimeout(500);

		const pos = await page.evaluate((id) => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.list.find((n: any) => n.id === id);
			return { x: node.x, y: node.y };
		}, newNodeId);

		expect(pos.x).toBe(500);
		expect(pos.y).toBe(300);
	});

	test('addNode with avoidOverlap:true moves node away from occupied position', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Get the position of the first existing node — place the new one exactly there
		const firstNodePos = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const first = demo?.flow.nodes.list[0];
			return { x: first.x, y: first.y };
		});

		const newNodeId = await page.evaluate(({ x, y }) => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.add({ type: 'NfWaNoteNode', x, y }); // avoidOverlap defaults to true
			return node.id;
		}, firstNodePos);
		await page.waitForTimeout(300);

		const pos = await page.evaluate((id) => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const node = demo?.flow.nodes.list.find((n: any) => n.id === id);
			return { x: node.x, y: node.y };
		}, newNodeId);

		// Should have been moved away from the occupied position
		const movedX = pos.x !== firstNodePos.x || pos.y !== firstNodePos.y;
		expect(movedX).toBe(true);
	});

	test('programmatic port connection via connectTo', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const linkCountBefore = (await getFlowState(page)).linkCount;

		// Find any two unconnected compatible ports and connect them
		const didConnect = await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const flow = demo?.flow;

			for (const node of flow.nodes.list) {
				if (!node.ports) continue;
				for (const [, port] of Object.entries(node.ports) as any) {
					if (port.direction !== 'out' || port.connectedTo.length > 0) continue;

					for (const other of flow.nodes.list) {
						if (other === node || !other.ports) continue;
						for (const [, inp] of Object.entries(other.ports) as any) {
							if (inp.direction === 'in' && inp.connectedTo.length === 0) {
								port.connectTo(inp);
								return true;
							}
						}
					}
				}
			}
			return false;
		});

		if (didConnect) {
			await page.waitForTimeout(300);
			const linkCountAfter = (await getFlowState(page)).linkCount;
			expect(linkCountAfter).toBe(linkCountBefore + 1);
		}
	});
});

test.describe('Event system', () => {
	test('flow.listen captures node drag events', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Set up event listener
		await page.evaluate(() => {
			(window as any).__nfeEvents = [];
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.listen((detail: any) => {
				(window as any).__nfeEvents.push({
					type: detail.type,
					method: detail.method,
				});
			});
		});

		// Drag a node to trigger events
		const handle = page.locator(sel.handle).first();
		const box = await handle.boundingBox();
		const from = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};
		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await page.mouse.move(from.x + 50, from.y + 30);
		await page.mouse.up();
		await page.waitForTimeout(200);

		const events = await page.evaluate(() => (window as any).__nfeEvents);
		expect(events.length).toBeGreaterThan(0);

		// Should include Node-type events
		const nodeEvents = events.filter((e: any) => e.type === 'Node');
		expect(nodeEvents.length).toBeGreaterThan(0);
	});

	test('flow.listen captures flow connection events', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await page.evaluate(() => {
			(window as any).__nfeEvents = [];
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			demo?.flow.listen((detail: any) => {
				(window as any).__nfeEvents.push({
					type: detail.type,
					method: detail.method,
				});
			});
		});

		// Connect ports programmatically
		await page.evaluate(() => {
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const flow = demo?.flow;
			for (const node of flow.nodes.list) {
				if (!node.ports) continue;
				for (const [, port] of Object.entries(node.ports) as any) {
					if (port.direction !== 'out' || port.connectedTo.length > 0) continue;
					for (const other of flow.nodes.list) {
						if (other === node || !other.ports) continue;
						for (const [, inp] of Object.entries(other.ports) as any) {
							if (inp.direction === 'in' && inp.connectedTo.length === 0) {
								port.connectTo(inp);
								return;
							}
						}
					}
				}
			}
		});

		await page.waitForTimeout(200);

		const events = await page.evaluate(() => (window as any).__nfeEvents);
		const flowEvents = events.filter((e: any) => e.type === 'Port');
		expect(flowEvents.some((e: any) => e.method === 'connectTo')).toBe(true);
	});

	test('listen returns an AbortController that stops listening', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const eventCount = await page.evaluate(() => {
			let count = 0;
			const demo = document.querySelector<DemoNfWa>('demo-nf-wa');
			const aborter = demo?.flow.listen(() => {
				count++;
			});
			// Abort immediately
			aborter.abort();

			// Trigger an action — this should NOT be captured
			const node = demo?.flow.nodes.list[0];
			node.updatePosition({ x: node.x + 10, y: node.y + 10 });

			return count;
		});

		// Should be 0 since we aborted before the action
		expect(eventCount).toBe(0);
	});
});
