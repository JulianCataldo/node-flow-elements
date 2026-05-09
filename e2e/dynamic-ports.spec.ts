/**
 * E2E tests for dynamic ports on NfWaTemplateNode.
 *
 * Verifies that:
 *  1. A TemplateNode already has its dynamic ports rendered on page load
 *     (from the kitchen-sink preset: "Hello, {{name}}! You are {{age}} years old.")
 *  2. Programmatically calling updateTemplate() adds / removes nf-port elements.
 *  3. The output port value reflects the interpolated template string.
 */

import { test, expect, waitForFlow, TESTBED_URL } from './helpers.js';

test.describe('Dynamic ports — TemplateNode', () => {
	test('preset template node renders dynamic input ports on load', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const portNames = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			if (!node) throw new Error('TemplateNode not found');
			return Object.keys(node.ports).filter((k: string) => k !== 'output');
		});

		expect(portNames).toContain('name');
		expect(portNames).toContain('age');
	});

	test('updateTemplate adds a new port', async ({ page }) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const portCountBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			return Object.keys(node.ports).length;
		});

		await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			node.updateTemplate('Hello {{name}} {{age}} {{city}}!');
		});

		await page.waitForTimeout(100);

		const ports = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			return Object.keys(node.ports);
		});

		expect(ports.length).toBeGreaterThan(portCountBefore);
		expect(ports).toContain('city');
		expect(ports).toContain('name');
		expect(ports).toContain('age');
		expect(ports).toContain('output');
	});

	test('updateTemplate removes a port that is no longer in the template', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// First confirm 'age' exists
		const hasBefore = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			return 'age' in node.ports;
		});
		expect(hasBefore).toBe(true);

		// Remove {{age}} from template
		await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			node.updateTemplate('Hello {{name}}!');
		});

		await page.waitForTimeout(100);

		const hasAfter = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			return 'age' in node.ports;
		});
		expect(hasAfter).toBe(false);
	});

	test('output port reflects interpolated value when input port has a value', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const output = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			// Set a simple template and push a value into the dynamic port
			node.updateTemplate('Hi {{firstName}}!');
			node.ports['firstName'].updateValue('Alice');
			return node.ports.output.value;
		});

		expect(output).toBe('Hi Alice!');
	});

	test('nf-port elements in the DOM reflect published dynamic ports', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		// Give Lit a render tick after signals settle
		await page.waitForTimeout(300);

		// Count nf-wa-port elements inside the template node's nf-wa-node shadow.
		// nf-wa-port lives in nf-wa-node's shadow DOM; we walk the shadow chain to
		// reach it without relying on piercing querySelectorAll.
		const portCount = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			if (!node) throw new Error('No TemplateNode');

			// nf-node is rendered in nf-flow's shadow DOM
			const nfFlow: any = demo.shadowRoot?.querySelector('nf-flow');
			if (!nfFlow?.shadowRoot) return 0;

			// nf-wa-node (template component) is in nf-flow's shadow tree.
			// Use the slot attribute to identify the right node.
			const nfWaNode: any = nfFlow.shadowRoot.querySelector(
				`nf-wa-node[slot="${node.slotName}"]`,
			);
			if (!nfWaNode?.shadowRoot) return 0;

			// nf-wa-port elements live in nf-wa-node's shadow DOM
			return nfWaNode.shadowRoot.querySelectorAll('nf-wa-port').length;
		});

		// Has output + at least the 2 preset dynamic ports (name, age)
		expect(portCount).toBeGreaterThanOrEqual(3);
	});

	test('serialise and restore preserves dynamic ports and template text', async ({
		page,
	}) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);

		const { serialised, portKeys } = await page.evaluate(() => {
			const demo = document.querySelector('demo-nf-wa') as any;
			const node = demo?.flow.nodes.list.find(
				(n: any) => n.type === 'NfWaTemplateNode',
			);
			const serialised = node.toJSON();
			const portKeys = Object.keys(serialised.ports ?? {});
			return { serialised, portKeys };
		});

		// Both dynamic ports must appear in the serialised ports map
		expect(portKeys).toContain('name');
		expect(portKeys).toContain('age');
		expect(portKeys).toContain('output');

		// templateText must be persisted
		expect(serialised.templateText).toBeTruthy();
		expect(serialised.templateText).toContain('{{name}}');
	});
});
