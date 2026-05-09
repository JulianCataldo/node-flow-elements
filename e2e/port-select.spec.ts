import { type Page } from '@playwright/test';

import { test, expect, waitForFlow, TESTBED_URL } from './helpers.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return `flow.links.selectedPort?.id ?? null` from the page. */
function getSelectedPortId(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		return demo.flow.links.selectedPort?.id ?? null;
	});
}

/**
 * Return `port.isSelected` for the given node/port pair.
 * `nodeId` is the node's `.id`, `portName` is the key in `node.ports`.
 */
function getPortIsSelected(page: Page, nodeId: string, portName: string) {
	return page.evaluate(
		([nId, pName]) => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo.flow.nodes.list.find((n: any) => n.id === nId);
			return node?.ports[pName]?.isSelected ?? null;
		},
		[nodeId, portName],
	);
}

/**
 * Return the `open` property of the `wa-dropdown.port-editor` that
 * corresponds to `portName` on `nodeId`.
 *
 * Mirrors the Footer rendering order: visible inputs first, outputs after.
 */
function getPortDropdownOpen(
	page: Page,
	nodeId: string,
	portName: string,
): Promise<boolean | null> {
	return page.evaluate(
		([nId, pName]) => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo.flow.nodes.list.find((n: any) => n.id === nId);
			if (!node) return null;

			const flowEl = demo.shadowRoot.querySelector('nf-flow') as any;
			if (!flowEl?.shadowRoot) return null;

			// nf-wa-node is in nf-flow's shadow root; it carries slot=node.slotName
			const waNode = flowEl.shadowRoot.querySelector(
				`[slot="${node.slotName}"]`,
			) as any;
			if (!waNode?.shadowRoot) return null;

			const dropdowns = [
				...waNode.shadowRoot.querySelectorAll('wa-dropdown.port-editor'),
			] as any[];

			const ports = Object.values(node.ports) as any[];
			const visible = ports.filter((p: any) => !p.metadata?.hidden);
			const ordered = [
				...visible.filter((p: any) => p.direction === 'in'),
				...visible.filter((p: any) => p.direction === 'out'),
			];
			const index = ordered.findIndex((p: any) => p.name === pName);
			if (index < 0 || !dropdowns[index]) return null;
			return dropdowns[index].open as boolean;
		},
		[nodeId, portName],
	);
}

/** Call `flow.links.selectPort` for a given node/port pair via evaluate. */
function apiSelectPort(page: Page, nodeId: string, portName: string) {
	return page.evaluate(
		([nId, pName]) => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo.flow.nodes.list.find((n: any) => n.id === nId);
			if (!node) throw new Error(`Node ${nId} not found`);
			const port = node.ports[pName];
			if (!port) throw new Error(`Port ${pName} not found on node ${nId}`);
			demo.flow.links.selectPort(port);
		},
		[nodeId, portName],
	);
}

/** Call `flow.links.selectPort(null)` (deselect). */
function apiDeselectPort(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		demo.flow.links.selectPort(null);
	});
}

// ── Shared node/port used across tests ───────────────────────────────────────
// NfWaNumberNode 'num_1' has a single output port 'number' with a JSON Schema,
// so it renders a wa-dropdown.port-editor with an enabled trigger button.
const TARGET_NODE = 'num_1';
const TARGET_PORT = 'number';

// ── Suites ───────────────────────────────────────────────────────────────────

test.describe('Port selection – core API', () => {
	test('selectedPort is null on initial load', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const id = await getSelectedPortId(page);
		expect(id).toBeNull();
	});

	test('selectPort sets port.isSelected to true', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);

		const isSelected = await getPortIsSelected(page, TARGET_NODE, TARGET_PORT);
		expect(isSelected).toBe(true);
	});

	test('flow.links.selectedPort reflects the selected port id', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const expectedId = await page.evaluate(
			([nId, pName]) => {
				const demo = document.querySelector('demo-nf-wa') as any;
				return demo.flow.nodes.list.find((n: any) => n.id === nId)?.ports[pName]
					?.id;
			},
			[TARGET_NODE, TARGET_PORT],
		);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);

		const selectedId = await getSelectedPortId(page);
		expect(selectedId).toBe(expectedId);
	});

	test('selectPort(null) deselects the port', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);
		expect(await getPortIsSelected(page, TARGET_NODE, TARGET_PORT)).toBe(true);

		await apiDeselectPort(page);
		expect(await getPortIsSelected(page, TARGET_NODE, TARGET_PORT)).toBe(false);
		expect(await getSelectedPortId(page)).toBeNull();
	});

	test('selecting a second port deselects the first', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Pick two distinct ports from different nodes
		const [portA, portB] = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const ports: { nodeId: string; portName: string }[] = [];
			for (const node of demo.flow.nodes.list) {
				if (ports.length >= 2) break;
				for (const [name] of Object.entries(node.ports) as any) {
					ports.push({ nodeId: node.id, portName: name });
					break;
				}
			}
			return ports;
		});

		await apiSelectPort(page, portA.nodeId, portA.portName);
		expect(await getPortIsSelected(page, portA.nodeId, portA.portName)).toBe(
			true,
		);

		await apiSelectPort(page, portB.nodeId, portB.portName);
		expect(await getPortIsSelected(page, portA.nodeId, portA.portName)).toBe(
			false,
		);
		expect(await getPortIsSelected(page, portB.nodeId, portB.portName)).toBe(
			true,
		);
	});
});

test.describe('Port selection – WA theme integration', () => {
	test('selectPort opens the wa-dropdown for the target port', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const before = await getPortDropdownOpen(page, TARGET_NODE, TARGET_PORT);
		expect(before).toBe(false);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);
		// Allow Lit signal → render → WA open one tick
		await page.waitForTimeout(100);

		const after = await getPortDropdownOpen(page, TARGET_NODE, TARGET_PORT);
		expect(after).toBe(true);
	});

	test('selectPort(null) closes the wa-dropdown', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);
		await page.waitForTimeout(100);
		expect(await getPortDropdownOpen(page, TARGET_NODE, TARGET_PORT)).toBe(
			true,
		);

		await apiDeselectPort(page);
		await page.waitForTimeout(100);
		expect(await getPortDropdownOpen(page, TARGET_NODE, TARGET_PORT)).toBe(
			false,
		);
	});

	test('clicking the trigger button sets flow.links.selectedPort', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// The trigger is wa-button[slot="trigger"] inside wa-dropdown.port-editor
		// inside nf-wa-node's shadow root. Playwright pierces open shadow roots.
		const trigger = page
			.locator('wa-dropdown.port-editor wa-button[slot="trigger"]')
			.first();
		await trigger.click();
		await page.waitForTimeout(150);

		const selectedId = await getSelectedPortId(page);
		expect(selectedId).not.toBeNull();
	});

	test('wa-hide event (dropdown close) deselects the port', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		await apiSelectPort(page, TARGET_NODE, TARGET_PORT);
		await page.waitForTimeout(100);
		expect(await getSelectedPortId(page)).not.toBeNull();

		// Dispatch wa-hide directly on the dropdown element
		await page.evaluate(
			([nId, pName]) => {
				const demo = document.querySelector('demo-nf-wa') as any;
				const node = demo.flow.nodes.list.find((n: any) => n.id === nId);
				if (!node) return;

				const flowEl = demo.shadowRoot.querySelector('nf-flow') as any;
				const waNode = flowEl?.shadowRoot?.querySelector(
					`[slot="${node.slotName}"]`,
				) as any;
				if (!waNode?.shadowRoot) return;

				const ports = Object.values(node.ports) as any[];
				const visible = ports.filter((p: any) => !p.metadata?.hidden);
				const ordered = [
					...visible.filter((p: any) => p.direction === 'in'),
					...visible.filter((p: any) => p.direction === 'out'),
				];
				const index = ordered.findIndex((p: any) => p.name === pName);
				const dropdown = waNode.shadowRoot.querySelectorAll(
					'wa-dropdown.port-editor',
				)[index];
				dropdown?.dispatchEvent(new CustomEvent('wa-hide', { bubbles: false }));
			},
			[TARGET_NODE, TARGET_PORT],
		);

		await page.waitForTimeout(100);
		expect(await getSelectedPortId(page)).toBeNull();
	});
});
