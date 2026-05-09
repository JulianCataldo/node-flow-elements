import { test, expect, waitForFlow, TESTBED_URL } from './helpers.js';

test.describe('Serialization', () => {
	test('toJSON returns a serializable object with all nodes', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const json = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return JSON.parse(JSON.stringify(demo.flow.toJSON()));
		});

		expect(json).toBeDefined();
		expect(json.nodes).toBeDefined();
		expect(Array.isArray(json.nodes)).toBe(true);
		expect(json.nodes.length).toBe(16);
	});

	test('each serialized node has required fields', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const nodes = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return JSON.parse(JSON.stringify(demo.flow.toJSON())).nodes;
		});

		for (const node of nodes) {
			expect(node.type).toBeTruthy();
			expect(node.id).toBeTruthy();
			expect(typeof node.x).toBe('number');
			expect(typeof node.y).toBe('number');
			expect(node.ports).toBeDefined();
		}
	});

	test('serialized nodes retain their positions', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Get live positions
		const livePositions = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.nodes.list.map((n: any) => ({
				id: n.id,
				x: n.x,
				y: n.y,
			}));
		});

		// Get serialized positions
		const serialized = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return JSON.parse(JSON.stringify(demo.flow.toJSON())).nodes.map(
				(n: any) => ({
					id: n.id,
					x: n.x,
					y: n.y,
				}),
			);
		});

		for (const live of livePositions) {
			const ser = serialized.find((s: any) => s.id === live.id);
			expect(ser).toBeDefined();
			expect(ser.x).toBe(live.x);
			expect(ser.y).toBe(live.y);
		}
	});

	test('serialized port connections are preserved', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const linksBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.list.length;
		});

		const json = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return JSON.parse(JSON.stringify(demo.flow.toJSON()));
		});

		// Count total connections in serialized form
		let totalConnections = 0;
		for (const node of json.nodes) {
			if (node.ports) {
				for (const [, port] of Object.entries(node.ports) as any) {
					if (port.connectedTo && Array.isArray(port.connectedTo)) {
						totalConnections += port.connectedTo.length;
					}
				}
			}
		}

		// Each link is stored from the "from" side, so total connections should equal link count
		// (connections might be stored on both sides, so >= linksBefore)
		expect(totalConnections).toBeGreaterThanOrEqual(linksBefore);
	});

	test('toJSON → fromJSON round-trip preserves node count', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const preserved = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo.flow;
			const originalCount = flow.nodes.list.length;

			const json = JSON.parse(JSON.stringify(flow.toJSON()));
			// fromJSON expects { nodeInfos }, toJSON returns { nodes }
			flow.nodes.clear();
			flow.fromJSON({ nodeInfos: json.nodes });

			return {
				originalCount,
				restoredCount: flow.nodes.list.length,
			};
		});
		await page.waitForTimeout(500);

		expect(preserved.restoredCount).toBe(preserved.originalCount);
	});

	test('position changes are captured in serialization', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Move a node programmatically
		await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo.flow.nodes.list[0];
			node.updatePosition({ x: 9999, y: 8888 });
		});

		const json = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return JSON.parse(JSON.stringify(demo.flow.toJSON()));
		});

		const movedNode = json.nodes[0];
		expect(movedNode.x).toBe(9999);
		expect(movedNode.y).toBe(8888);
	});
});
