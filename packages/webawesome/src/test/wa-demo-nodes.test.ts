import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { Flow } from '@node-flow-elements/core/flow';

const tick = (): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, 0));

describe('NFE headless graph — actual WA demo nodes (diagnostic)', async () => {
	let NfWaNumberNode: typeof import('../demo-nodes/number.el.js').NfWaNumberNode;
	let NfWaOperationNode: typeof import('../demo-nodes/operation.el.js').NfWaOperationNode;
	let NfWaDisplayNumberNode: typeof import('../demo-nodes/display-number.el.js').NfWaDisplayNumberNode;

	before(async () => {
		({ NfWaNumberNode } = await import('../demo-nodes/number.el.js'));
		({ NfWaOperationNode } = await import('../demo-nodes/operation.el.js'));
		({ NfWaDisplayNumberNode } = await import(
			'../demo-nodes/display-number.el.js'
		));
	});

	it('demo node classes are importable without DOM', () => {
		assert.ok(NfWaNumberNode, 'NfWaNumberNode loaded');
		assert.ok(NfWaOperationNode, 'NfWaOperationNode loaded');
		assert.ok(NfWaDisplayNumberNode, 'NfWaDisplayNumberNode loaded');
	});

	it('2 + 3 = 5 through WA demo nodes', async () => {
		const waNodeTypes = {
			NfWaNumberNode,
			NfWaOperationNode,
			NfWaDisplayNumberNode,
		};
		const flow = new Flow({ nodeTypes: waNodeTypes });

		const numberA = flow.nodes.add({
			type: 'NfWaNumberNode',
			id: 'wa-numA',
			x: 0,
			y: 0,
		});
		const numberB = flow.nodes.add({
			type: 'NfWaNumberNode',
			id: 'wa-numB',
			x: 0,
			y: 150,
		});
		const op = flow.nodes.add({
			type: 'NfWaOperationNode',
			id: 'wa-op',
			x: 250,
			y: 0,
		});
		const display = flow.nodes.add({
			type: 'NfWaDisplayNumberNode',
			id: 'wa-display',
			x: 500,
			y: 0,
		});

		numberA.ports.number.connectTo(op.ports.numberA);
		numberB.ports.number.connectTo(op.ports.numberB);
		op.ports.result.connectTo(display.ports.number);

		numberA.ports.number.updateValue(2);
		numberB.ports.number.updateValue(3);
		await tick();

		assert.equal(display.ports.number.value, 5);
	});
});
