/**
 * Headless NFE unit test — no browser, no DOM, pure node:test.
 *
 * Goal: prove that a live signal-based data-flow graph works correctly
 * when NO Template() is ever mounted.
 *
 * Single scope:
 *   - Inline nodes — lightweight, always-safe, tests core mechanics.
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { reaction } from 'signal-utils/subtle/reaction';

// Import core classes directly — NOT from dist/index.js (that file has
// side-effect imports of .el.js files that call customElements.define()).
import { Flow } from '../flow.js';
import { Node } from '../node.js';
import { defineNode, definePort } from '../types.js';

// ---------------------------------------------------------------------------
// Inline node definitions — no JSX, no Lit, no DOM
// ---------------------------------------------------------------------------

const numDef = defineNode({
	type: 'UnitNumberNode',
	defaultDisplayName: 'Number',
	defaultIcon: 'number',
	helpText: null,
	ports: {
		out: definePort<number>({ direction: 'out', initialValue: 0 }),
	},
});

class NumberNode extends Node<typeof numDef> {
	public static override readonly definition = numDef;
}

const sumDef = defineNode({
	type: 'UnitSumNode',
	defaultDisplayName: 'Sum',
	defaultIcon: 'plus',
	helpText: null,
	ports: {
		a: definePort<number>({ direction: 'in' }),
		b: definePort<number>({ direction: 'in' }),
		result: definePort<number>({ direction: 'out', initialValue: 0 }),
	},
});

class SumNode extends Node<typeof sumDef> {
	public static override readonly definition = sumDef;

	constructor(options: any) {
		super(options);
		reaction(
			() => [this.ports.a.value, this.ports.b.value],
			() => {
				const a = this.ports.a.value ?? 0;
				const b = this.ports.b.value ?? 0;
				this.ports.result.updateValue((a as number) + (b as number));
			},
		);
	}
}

const displayDef = defineNode({
	type: 'UnitDisplayNode',
	defaultDisplayName: 'Display',
	defaultIcon: 'eye',
	helpText: null,
	ports: {
		input: definePort<number>({ direction: 'in' }),
	},
});

class DisplayNode extends Node<typeof displayDef> {
	public static override readonly definition = displayDef;
}

const nodeTypes = {
	UnitNumberNode: NumberNode,
	UnitSumNode: SumNode,
	UnitDisplayNode: DisplayNode,
} as const;

/** Let queued microtasks (reactions) settle before asserting. */
const tick = (): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------
// 1. Core mechanics — inline nodes
// ---------------------------------------------------------------------------

describe('NFE headless graph — inline nodes', () => {
	let flow: Flow<typeof nodeTypes>;
	let numberA: InstanceType<typeof NumberNode>;
	let numberB: InstanceType<typeof NumberNode>;
	let op: InstanceType<typeof SumNode>;
	let display: InstanceType<typeof DisplayNode>;

	before(() => {
		flow = new Flow({ nodeTypes });
		numberA = flow.nodes.add({
			type: 'UnitNumberNode',
			id: 'numA',
			x: 0,
			y: 0,
		});
		numberB = flow.nodes.add({
			type: 'UnitNumberNode',
			id: 'numB',
			x: 0,
			y: 150,
		});
		op = flow.nodes.add({ type: 'UnitSumNode', id: 'op', x: 250, y: 0 });
		display = flow.nodes.add({
			type: 'UnitDisplayNode',
			id: 'display',
			x: 500,
			y: 0,
		});

		numberA.ports.out.connectTo(op.ports.a);
		numberB.ports.out.connectTo(op.ports.b);
		op.ports.result.connectTo(display.ports.input);
	});

	it('graph is wired — 4 nodes, correct port connections', () => {
		assert.equal(flow.nodes.list.length, 4);
		assert.equal(numberA.ports.out.connectedTo.length, 1);
		assert.equal(numberB.ports.out.connectedTo.length, 1);
		assert.equal(op.ports.result.connectedTo.length, 1);
		assert.equal(display.ports.input.connectedTo.length, 1);
	});

	it('initial connectTo seeds downstream port values', () => {
		// connectTo already called updateValue(from.value) on the in-port.
		assert.equal(op.ports.a.value, 0);
		assert.equal(op.ports.b.value, 0);
	});

	it('3 + 7 propagates end-to-end after reactions settle', async () => {
		numberA.ports.out.updateValue(3);
		numberB.ports.out.updateValue(7);
		await tick();
		assert.equal(display.ports.input.value, 10);
	});

	it('changing one operand re-runs the reaction', async () => {
		numberA.ports.out.updateValue(20);
		await tick();
		assert.equal(display.ports.input.value, 27); // 20 + 7
	});

	it('flow.links reflects out-port walk', () => {
		const links = flow.links.list;
		// 3 connections: numA→op.a, numB→op.b, op.result→display.input
		assert.equal(links.length, 3);
	});

	it('disconnect stops propagation', async () => {
		numberA.ports.out.disconnect(op.ports.a);
		assert.equal(numberA.ports.out.connectedTo.length, 0);
		assert.equal(op.ports.a.connectedTo.length, 0);

		// op.ports.a still holds the last known value; updating numA has no effect.
		numberA.ports.out.updateValue(999);
		await tick();
		assert.equal(
			op.ports.a.value,
			20,
			'stale value — no propagation after disconnect',
		);
		assert.equal(
			display.ports.input.value,
			27,
			'display unchanged after disconnect',
		);
	});

	it('reconnect restores propagation', async () => {
		numberA.ports.out.connectTo(op.ports.a); // reconnect (seeds op.a = 999)
		await tick();
		assert.equal(display.ports.input.value, 1006); // 999 + 7
	});
});
