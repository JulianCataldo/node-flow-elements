/**
 * TDD — MissingNode placeholder
 *
 * When a flow is deserialised and a node type is not present in the registry
 * (e.g. the user disabled a plugin), NFE must NOT throw.  Instead it should
 * produce a "MissingNode" placeholder that:
 *
 *   • preserves id, coordinates, and customDisplayName from the serialised data
 *   • exposes `isMissing = true` and `missingType` (the original type string)
 *   • materialises ports inferred from the serialised port keys (direction 'both')
 *   • allows existing wiring to/from the placeholder to be restored
 *
 * These tests import directly from `dist/` (same pattern as calculator.test.ts)
 * so they exercise the *compiled* output, not the raw TypeScript source.
 *
 * Run:  pnpm build:lib && pnpm test:unit
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { Flow } from '../flow.js';
import { Node } from '../node.js';
import { MissingNode } from '../missing-node.js';
import { defineNode, definePort } from '../types.js';
import type { Port } from '../port.js';

// ---------------------------------------------------------------------------
// Known node types used as neighbours / wiring targets
// ---------------------------------------------------------------------------

const sourceDef = defineNode({
	type: 'SourceNode',
	defaultDisplayName: 'Source',
	defaultIcon: 'circle',
	helpText: null,
	ports: {
		out: definePort<number>({ direction: 'out', initialValue: 42 }),
	},
});
class SourceNode extends Node<typeof sourceDef> {
	public static override readonly definition = sourceDef;
}

const sinkDef = defineNode({
	type: 'SinkNode',
	defaultDisplayName: 'Sink',
	defaultIcon: 'circle',
	helpText: null,
	ports: {
		in: definePort<number>({ direction: 'in' }),
	},
});
class SinkNode extends Node<typeof sinkDef> {
	public static override readonly definition = sinkDef;
}

const knownRegistry = {
	SourceNode,
	SinkNode,
} as const;

// ---------------------------------------------------------------------------
// Helper: build a serialised snapshot that includes an unknown node type
// ---------------------------------------------------------------------------

/**
 * A serialised flow that represents:
 *
 *   source (SourceNode) ──out→ ghost.input
 *   ghost.output ──→ sink.in (SinkNode)
 *
 * where "GhostNode" is intentionally *not* in the registry.
 */
const GHOST_TYPE = 'GhostNode';

const serialisedFlow = {
	nodeInfos: [
		{
			type: 'SourceNode' as const,
			id: 'node_source',
			x: 0,
			y: 0,
		},
		{
			type: GHOST_TYPE,
			id: 'node_ghost',
			x: 200,
			y: 50,
			customDisplayName: 'My Ghost',
			ports: {
				input: {
					value: null,
					connectedTo: [{ node: 'node_source', port: 'out' }],
				},
				output: {
					value: null,
					connectedTo: [{ node: 'node_sink', port: 'in' }],
				},
			},
		},
		{
			type: 'SinkNode' as const,
			id: 'node_sink',
			x: 400,
			y: 0,
		},
	],
};

// ---------------------------------------------------------------------------
// Suite 1 — fromJSON resilience: no throw, correct placeholder shape
// ---------------------------------------------------------------------------

describe('MissingNode — fromJSON resilience', () => {
	let flow: Flow<typeof knownRegistry>;

	before(() => {
		flow = new Flow({ nodeTypes: knownRegistry });
		// Must NOT throw even though 'GhostNode' is absent from the registry.
		flow.fromJSON(serialisedFlow as Parameters<typeof flow.fromJSON>[0]);
	});

	it('does not throw when an unknown type appears in serialised data', () => {
		// The `before` hook above proves this: if it had thrown the suite would
		// never reach any `it` block.
		assert.equal(flow.nodes.list.length, 3);
	});

	it('all three nodes are present in the flow', () => {
		assert.equal(flow.nodes.list.length, 3);
	});

	it('missing-node placeholder has the original id', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost');
		assert.ok(ghost, 'placeholder node not found');
	});

	it('missing-node placeholder preserves coordinates', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.equal(ghost.x, 200);
		assert.equal(ghost.y, 50);
	});

	it('missing-node placeholder preserves customDisplayName', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.equal(ghost.customDisplayName, 'My Ghost');
	});

	it('placeholder exposes isMissing = true', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.equal((ghost as unknown as MissingNode).isMissing, true);
	});

	it('placeholder exposes missingType equal to the original type string', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.equal((ghost as unknown as MissingNode).missingType, GHOST_TYPE);
	});
});

// ---------------------------------------------------------------------------
// Suite 2 — port inference
// ---------------------------------------------------------------------------

describe('MissingNode — port inference', () => {
	let flow: Flow<typeof knownRegistry>;

	before(() => {
		flow = new Flow({ nodeTypes: knownRegistry });
		flow.fromJSON(serialisedFlow as Parameters<typeof flow.fromJSON>[0]);
	});

	it('infers port keys from serialised port data', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.ok('input' in ghost.ports, 'expected port "input"');
		assert.ok('output' in ghost.ports, 'expected port "output"');
	});

	it('inferred port count matches serialised port count', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.equal(Object.keys(ghost.ports).length, 2);
	});

	it('inferred ports are Port instances on the placeholder node', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		for (const port of Object.values(ghost.ports) as Port[]) {
			assert.equal(port.superType, 'Port');
			assert.equal(port.node, ghost);
		}
	});
});

// ---------------------------------------------------------------------------
// Suite 3 — connection restoration across the placeholder
// ---------------------------------------------------------------------------

describe('MissingNode — wiring restoration', () => {
	let flow: Flow<typeof knownRegistry>;

	before(() => {
		flow = new Flow({ nodeTypes: knownRegistry });
		flow.fromJSON(serialisedFlow as Parameters<typeof flow.fromJSON>[0]);
	});

	it('link from known source.out → ghost.input is restored', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		const source = flow.nodes.list.find((n) => n.id === 'node_source')!;

		const sourceOut = (source as SourceNode).ports.out;
		const ghostInput = (ghost.ports as Record<string, Port>)['input'];

		assert.ok(
			sourceOut.connectedTo.includes(ghostInput) ||
				ghostInput.connectedTo.includes(sourceOut),
			'source.out is not connected to ghost.input',
		);
	});

	it('link from ghost.output → known sink.in is restored', () => {
		const ghost = flow.nodes.list.find((n) => n.id === 'node_ghost')!;
		const sink = flow.nodes.list.find((n) => n.id === 'node_sink')!;

		const ghostOutput = (ghost.ports as Record<string, Port>)['output'];
		const sinkIn = (sink as SinkNode).ports.in;

		assert.ok(
			ghostOutput.connectedTo.includes(sinkIn) ||
				sinkIn.connectedTo.includes(ghostOutput),
			'ghost.output is not connected to sink.in',
		);
	});

	it('flow.links.list contains connections that pass through the placeholder', () => {
		// At minimum two links: source→ghost and ghost→sink.
		assert.ok(
			flow.links.list.length >= 2,
			`expected ≥2 links, got ${flow.links.list.length}`,
		);
	});
});

// ---------------------------------------------------------------------------
// Suite 4 — nodes.add() API for a missing type
// ---------------------------------------------------------------------------

describe('MissingNode — nodes.add() direct API', () => {
	let flow: Flow<typeof knownRegistry>;

	before(() => {
		flow = new Flow({ nodeTypes: knownRegistry });
	});

	it('does not throw when adding an unknown type', () => {
		assert.doesNotThrow(() => {
			(flow.nodes as any).add(
				{ type: 'UnregisteredType', id: 'node_unregistered', x: 0, y: 0 },
				{ avoidOverlap: false },
			);
		});
	});

	it('the returned node has isMissing = true', () => {
		const node = flow.nodes.list.find((n) => n.id === 'node_unregistered')!;
		assert.equal((node as unknown as MissingNode).isMissing, true);
	});

	it('the returned node has missingType matching the requested type', () => {
		const node = flow.nodes.list.find((n) => n.id === 'node_unregistered')!;
		assert.equal(
			(node as unknown as MissingNode).missingType,
			'UnregisteredType',
		);
	});
});

// ---------------------------------------------------------------------------
// Suite 5 — toJSON round-trip
// ---------------------------------------------------------------------------

describe('MissingNode — toJSON round-trip', () => {
	it('a flow containing a missing node can be serialised and deserialised without loss', () => {
		// First load: produces placeholders
		const flow1 = new Flow({ nodeTypes: knownRegistry });
		flow1.fromJSON(serialisedFlow as Parameters<typeof flow1.fromJSON>[0]);

		// Serialise each node
		const serialised = flow1.nodes.list.map((n) => n.toJSON());

		// Second load from the serialised snapshot (still unknown type)
		const flow2 = new Flow({ nodeTypes: knownRegistry });
		assert.doesNotThrow(() => {
			flow2.fromJSON({
				nodeInfos: serialised as Parameters<
					typeof flow2.fromJSON
				>[0]['nodeInfos'],
			});
		});

		assert.equal(flow2.nodes.list.length, 3);

		const ghost2 = flow2.nodes.list.find((n) => n.id === 'node_ghost')!;
		assert.ok(ghost2, 'placeholder not found after round-trip');
		assert.equal((ghost2 as unknown as MissingNode).isMissing, true);
	});
});
