/**
 * Headless unit tests for signal-backed dynamic ports:
 *  - publishPort adds a port to the live collection
 *  - retractPort removes a port and disconnects it
 *  - TemplateNode syncs ports from mustache template text
 *  - Output interpolation updates when an input port value changes
 *  - Serialise/restore round-trip via toJSON / constructor opts
 *
 * Run: pnpm build:lib && pnpm test:unit
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { Flow } from '../flow.js';
import { Node } from '../node.js';
import { defineNode, definePort } from '../types.js';
import type { PortDefinition } from '../types.js';
import type { Port } from '../port.js';

// ---------------------------------------------------------------------------
// Minimal inline node with no ports (for publishPort / retractPort testing)
// ---------------------------------------------------------------------------

const blankDef = defineNode({
	type: 'BlankNode',
	defaultDisplayName: 'Blank',
	defaultIcon: 'circle',
	helpText: null,
	ports: {},
});

class BlankNode extends Node<typeof blankDef> {
	public static override readonly definition = blankDef;

	// Expose protected methods publicly for test access
	public publish<T = unknown>(name: string, def: PortDefinition<T>) {
		return this.publishPort(name, def);
	}
	public retract(name: string) {
		return this.retractPort(name);
	}
}

// ---------------------------------------------------------------------------
// TemplateNode equivalent (no DOM / Lit dependency)
// ---------------------------------------------------------------------------

import { reaction } from 'signal-utils/subtle/reaction';

const tmplDef = defineNode({
	type: 'HeadlessTemplateNode',
	defaultDisplayName: 'Template',
	defaultIcon: 'braces',
	helpText: null,
	ports: {
		output: definePort<string>({
			direction: 'out',
			customDisplayName: 'Output',
		}),
	},
});

class HeadlessTemplateNode extends Node<typeof tmplDef> {
	public static override readonly definition = tmplDef;

	#templateText = '';

	constructor(options: ConstructorParameters<typeof Node>[0]) {
		super(options);

		const initialText = (options.data as Record<string, unknown> | undefined)
			?.templateText;
		if (typeof initialText === 'string' && initialText) {
			this.#templateText = initialText;
			this.#syncPorts(initialText);
		}

		reaction(
			() => {
				const tmpl = this.#templateText;
				const ports = this.$ports.get();
				return [
					tmpl,
					...Object.entries(ports)
						.filter(([k]) => k !== 'output')
						.map(([, p]) => p.value),
				];
			},
			() => this.#computeOutput(),
		);
	}

	#parseMustache(text: string): string[] {
		return [...new Set([...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]))];
	}

	#syncPorts(text: string): void {
		const wanted = new Set(this.#parseMustache(text));
		const current = new Set(
			Object.keys(this.$ports.get()).filter((k) => k !== 'output'),
		);
		for (const k of current) if (!wanted.has(k)) this.retractPort(k);
		for (const k of wanted)
			if (!current.has(k))
				this.publishPort(k, { direction: 'in', customDisplayName: k });
	}

	#computeOutput(): void {
		const ports = this.$ports.get();
		const result = this.#templateText.replaceAll(/{{(\w+)}}/g, (_, k: string) =>
			String(ports[k]?.value ?? ''),
		);
		this.ports.output.updateValue(result);
	}

	public updateTemplate(text: string): void {
		this.#templateText = text;
		this.#syncPorts(text);
	}

	public override toJSON() {
		return { ...super.toJSON(), templateText: this.#templateText };
	}
}

// ---------------------------------------------------------------------------
// Shared flow used across all tests
// ---------------------------------------------------------------------------

let flow: Flow<{
	BlankNode: typeof BlankNode;
	HeadlessTemplateNode: typeof HeadlessTemplateNode;
}>;

before(() => {
	flow = new Flow({
		nodeTypes: { BlankNode, HeadlessTemplateNode },
	});
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('publishPort / retractPort', () => {
	it('publishPort adds a port to the live ports collection', () => {
		const node = new BlankNode({ flow });

		assert.equal(Object.keys(node.ports).length, 0, 'starts empty');
		node.publish('myPort', { direction: 'in' });
		assert.ok('myPort' in node.ports, 'port appears after publish');
		assert.equal(
			(node.ports as Record<string, Port>)['myPort'].direction,
			'in',
		);
	});

	it('publishPort sets the port name correctly', () => {
		const node = new BlankNode({ flow });
		node.publish('alpha', { direction: 'out' });
		assert.equal((node.ports as Record<string, Port>)['alpha'].name, 'alpha');
	});

	it('retractPort removes an existing port', () => {
		const node = new BlankNode({ flow });
		node.publish('ephemeral', { direction: 'in' });
		assert.ok('ephemeral' in node.ports);

		node.retract('ephemeral');
		assert.ok(!('ephemeral' in node.ports), 'port removed after retract');
	});

	it('retractPort disconnects the port before removal', () => {
		const sourceNode = new BlankNode({ flow });
		const dstNode = new BlankNode({ flow });

		sourceNode.publish('out', { direction: 'out' });
		dstNode.publish('inp', { direction: 'in' });

		const sourcePorts = sourceNode.ports as Record<string, Port>;
		const dstPorts = dstNode.ports as Record<string, Port>;
		sourcePorts['out'].connectTo(dstPorts['inp']);
		assert.equal(sourcePorts['out'].connectedTo.length, 1);

		dstNode.retract('inp');

		assert.equal(
			sourcePorts['out'].connectedTo.length,
			0,
			'disconnected on retract',
		);
	});

	it('retractPort is a no-op for a non-existent port', () => {
		const node = new BlankNode({ flow });
		// Should not throw
		assert.doesNotThrow(() => node.retract('nope'));
	});

	it('$ports signal is reactive: ports added are reflected immediately', () => {
		const node = new BlankNode({ flow });
		node.publish('p1', { direction: 'both' });
		node.publish('p2', { direction: 'both' });

		const keys = Object.keys(node.$ports.get());
		assert.ok(keys.includes('p1'));
		assert.ok(keys.includes('p2'));
	});
});

describe('HeadlessTemplateNode', () => {
	it('updateTemplate publishes ports for mustache vars', () => {
		const node = new HeadlessTemplateNode({ flow });
		node.updateTemplate('Hi {{name}}, you are {{age}}!');

		assert.ok('name' in node.ports);
		assert.ok('age' in node.ports);
		assert.equal((node.ports as Record<string, Port>)['name'].direction, 'in');
	});

	it('updateTemplate removes ports for vars no longer present', () => {
		const node = new HeadlessTemplateNode({ flow });
		node.updateTemplate('{{a}} {{b}} {{c}}');
		assert.ok('a' in node.ports && 'b' in node.ports && 'c' in node.ports);

		node.updateTemplate('{{a}} {{c}}');
		assert.ok(!('b' in node.ports), 'b removed');
		assert.ok('a' in node.ports && 'c' in node.ports, 'a and c kept');
	});

	it('output reflects interpolation after pushing a value to a dynamic port', async () => {
		const node = new HeadlessTemplateNode({ flow });
		node.updateTemplate('Hello {{who}}!');
		(node.ports as Record<string, Port>)['who'].updateValue('World');

		// reaction is async via microtask; wait a tick
		await Promise.resolve();

		assert.equal(node.ports.output.value, 'Hello World!');
	});

	it('duplicate mustache vars produce only one port', () => {
		const node = new HeadlessTemplateNode({ flow });
		node.updateTemplate('{{x}} and {{x}} again');
		const inputKeys = Object.keys(node.ports).filter((k) => k !== 'output');
		assert.equal(inputKeys.length, 1);
	});

	it('toJSON includes templateText', () => {
		const node = new HeadlessTemplateNode({ flow });
		node.updateTemplate('{{foo}} bar');
		const json = node.toJSON() as any;
		assert.equal(json.templateText, '{{foo}} bar');
	});

	it('restores dynamic ports from serialised templateText on construction', () => {
		const node = new HeadlessTemplateNode({
			flow,
			data: {
				id: 'tmpl_test',
				x: 0,
				y: 0,
				templateText: 'Dear {{title}} {{surname}},',
			} as any,
		});

		assert.ok('title' in node.ports, 'title port restored');
		assert.ok('surname' in node.ports, 'surname port restored');
	});

	it('static output port is always present', () => {
		const node = new HeadlessTemplateNode({ flow });
		assert.ok('output' in node.ports);
		assert.equal(node.ports.output.direction, 'out');
	});
});
