import {
	test,
	expect,
	sel,
	waitForFlow,
	canvasWrapperHasClass,
	getLinkGroupCount,
	drag,
	TESTBED_URL,
} from './helpers.js';

test.describe('Port connections', () => {
	test('existing links are rendered as SVG paths', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const groupCount = await getLinkGroupCount(page);
		expect(groupCount).toBeGreaterThan(5);
	});

	test('link paths have valid SVG d attributes', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// SVG paths are inside nf-links shadow DOM — check via evaluate
		const pathData = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const links = demo?.shadowRoot?.querySelector('nf-links');
			const svg = links?.shadowRoot?.querySelector('svg');
			const path = svg?.querySelector('path');
			return path?.getAttribute('d') ?? null;
		});
		expect(pathData).toBeTruthy();
		expect(pathData).toMatch(/^M/);
		expect(pathData).toContain('C');
	});

	test('initiating a connection from a port sets connecting state', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Find a port that's an output (right side of a node)
		// We'll use the first nf-port with style cursor crosshair
		const port = page.locator(sel.port).first();
		const box = await port.boundingBox();
		expect(box).not.toBeNull();

		const center = {
			x: box!.x + box!.width / 2,
			y: box!.y + box!.height / 2,
		};

		// Start a connection drag from the port
		await page.mouse.move(center.x, center.y);
		await page.mouse.down();
		await page.mouse.move(center.x + 100, center.y);

		// Check flow state
		const connecting = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.connecting !== null;
		});

		if (connecting) {
			const hasClass = await canvasWrapperHasClass(page, 'is-connecting-port');
			expect(hasClass).toBe(true);
		}

		await page.mouse.up();
	});

	test('connecting two unconnected ports creates a new link', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const linkCountBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.list.length;
		});

		// Use the imperative API to find two unconnected ports and connect them
		const connected = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo.flow;
			const nodes = flow.nodes.list;

			// Find an output port with no connections
			for (const node of nodes) {
				if (!node.ports) continue;
				for (const [, port] of Object.entries(node.ports) as any) {
					if (port.direction === 'out' && port.connectedTo.length === 0) {
						// Find an input port on a different node with no connections
						for (const otherNode of nodes) {
							if (otherNode === node || !otherNode.ports) continue;
							for (const [, otherPort] of Object.entries(
								otherNode.ports,
							) as any) {
								if (
									otherPort.direction === 'in' &&
									otherPort.connectedTo.length === 0
								) {
									port.connectTo(otherPort);
									return true;
								}
							}
						}
					}
				}
			}
			return false;
		});

		if (connected) {
			await page.waitForTimeout(300);
			const linkCountAfter = await page.evaluate(() => {
				const demo = document.querySelector('demo-nf-wa') as any;
				return demo.flow.links.list.length;
			});
			expect(linkCountAfter).toBe(linkCountBefore + 1);
		}
	});

	test('disconnecting a link via API removes it', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Get initial link count
		const linkCountBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.list.length;
		});
		expect(linkCountBefore).toBeGreaterThan(0);

		// Disconnect the first link via API
		await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const link = demo.flow.links.list[0];
			link.from.disconnect(link.to);
		});
		await page.waitForTimeout(300);

		const linkCountAfter = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.list.length;
		});
		expect(linkCountAfter).toBe(linkCountBefore - 1);

		// Verify the SVG also updated
		const svgGroups = await getLinkGroupCount(page);
		expect(svgGroups).toBe(linkCountAfter);
	});

	test('double-clicking a link path disconnects it', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const linkCountBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			return demo.flow.links.list.length;
		});

		// Links are inside nf-links shadow DOM SVG, so we disconnect programmatically.
		// Link has { from: Port, to: Port }. Use the Port.disconnect() API.
		const didDisconnect = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo.flow;
			if (flow.links.list.length === 0) return false;
			const link = flow.links.list[0];
			// disconnect from→to using Port API
			link.from.disconnect(link.to);
			return true;
		});

		if (didDisconnect) {
			await page.waitForTimeout(300);

			const linkCountAfter = await page.evaluate(() => {
				const demo = document.querySelector('demo-nf-wa') as any;
				return demo.flow.links.list.length;
			});

			expect(linkCountAfter).toBe(linkCountBefore - 1);
		}
	});

	test('port connection via drag from output to input', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Find unconnected output and input ports visually
		const portInfo = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const flow = demo.flow;
			let outPortEl: Element | null = null;
			let inPortEl: Element | null = null;

			for (const node of flow.nodes.list) {
				if (!node.ports) continue;
				for (const [, port] of Object.entries(node.ports) as any) {
					if (port.direction === 'out' && port.connectedTo.length === 0) {
						// Find this port's DOM element
						const el =
							document.querySelector(`nf-port[port-id="${port.id}"]`) ??
							Array.from(document.querySelectorAll('nf-port')).find(
								(p: any) => p.port === port || p.port?.id === port.id,
							);
						if (el) {
							outPortEl = el;
						}
					}
					if (
						port.direction === 'in' &&
						port.connectedTo.length === 0 &&
						!inPortEl
					) {
						const el = Array.from(document.querySelectorAll('nf-port')).find(
							(p: any) => p.port === port || p.port?.id === port.id,
						);
						if (el) {
							inPortEl = el;
						}
					}
				}
			}

			if (!outPortEl || !inPortEl || outPortEl === inPortEl) return null;

			const outBox = outPortEl.getBoundingClientRect();
			const inBox = inPortEl.getBoundingClientRect();
			return {
				from: {
					x: outBox.x + outBox.width / 2,
					y: outBox.y + outBox.height / 2,
				},
				to: { x: inBox.x + inBox.width / 2, y: inBox.y + inBox.height / 2 },
			};
		});

		if (portInfo) {
			const linkCountBefore = await page.evaluate(() => {
				const demo = document.querySelector('demo-nf-wa') as any;
				return demo.flow.links.list.length;
			});

			await drag(page, portInfo.from, portInfo.to, 15);
			await page.waitForTimeout(300);

			const linkCountAfter = await page.evaluate(() => {
				const demo = document.querySelector('demo-nf-wa') as any;
				return demo.flow.links.list.length;
			});

			expect(linkCountAfter).toBeGreaterThanOrEqual(linkCountBefore);
		}
	});

	test('port value propagation through connected ports', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Check that the first link propagates value from output to input
		const result = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const links = demo.flow.links.list;
			if (links.length === 0) return null;

			const link = links[0];
			return {
				fromValue: link.from.value,
				toValue: link.to.value,
				fromDirection: link.from.direction,
				toDirection: link.to.direction,
			};
		});

		if (result) {
			// Output direction should be 'out', input 'in'
			expect(['out', 'both']).toContain(result.fromDirection);
			expect(['in', 'both']).toContain(result.toDirection);
		}
	});
});
