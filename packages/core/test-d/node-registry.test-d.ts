/**
 * TYPE TESTS — Node Registry, defineNode & definePort
 *
 * These tests describe the supported definition-driven public API.
 *
 * Workflow scenarios tested:
 * 1. Define custom nodes with static typed definitions
 * 2. Create a node registry
 * 3. Instantiate a Flow from the registry
 * 4. addNode with discriminated type safety
 * 5. Port manipulation with full type safety
 * 6. Serialization / deserialization round-trip
 * 7. initialNodes at construction time
 * 8. Per-port metadata — heterogeneous, inferred, type-safe
 * 9. Validate as type guard — infers port Value type
 * 10. Standard Schema port inference
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, test } from 'tstyche';

import { Flow } from '../src/flow.js';
import { Node } from '../src/node.js';
import type { Port } from '../src/port.js';
import {
	defineNode,
	definePort,
	type Link,
	type PortInstancesFromDefinitions,
} from '../src/types.js';

const numberInputNodeDefinition = defineNode({
	type: 'NumberInputNode',
	defaultDisplayName: 'Number Input',
	defaultIcon: 'plus-minus',
	helpText: null,
	ports: {
		number: definePort<number>({ direction: 'out', initialValue: 0 }),
	},
});

class NumberInputNode extends Node<typeof numberInputNodeDefinition> {
	public static override readonly definition = numberInputNodeDefinition;
}

const operationNodeDefinition = defineNode({
	type: 'OperationNode',
	defaultDisplayName: 'Operation',
	defaultIcon: 'calculator',
	helpText: null,
	ports: {
		numberA: definePort<number>({
			direction: 'in',
			customDisplayName: 'Operand A',
		}),
		numberB: definePort<number>({
			direction: 'in',
			customDisplayName: 'Operand B',
		}),
		result: definePort<number>({
			direction: 'out',
			customDisplayName: 'Result',
			initialValue: 0,
		}),
	},
});

class OperationNode extends Node<typeof operationNodeDefinition> {
	public static override readonly definition = operationNodeDefinition;
}

const displayNodeDefinition = defineNode({
	type: 'DisplayNode',
	defaultDisplayName: 'Display',
	defaultIcon: 'clipboard-text',
	helpText: null,
	ports: {
		number: definePort<number, { readonly label: 'Number to display' }>({
			direction: 'in',
			metadata: { label: 'Number to display' },
		}),
	},
});

class DisplayNode extends Node<typeof displayNodeDefinition> {
	public static override readonly definition = displayNodeDefinition;
}

const nodeTypes = {
	NumberInputNode,
	OperationNode,
	DisplayNode,
} as const;

type Registry = typeof nodeTypes;
type DisplayPortsFromDefinition = PortInstancesFromDefinitions<
	typeof displayNodeDefinition.ports
>;

declare const displayPortsFromDefinition: DisplayPortsFromDefinition;

const flow = new Flow({ nodeTypes });
const numberNode = flow.nodes.add({
	type: 'NumberInputNode',
	id: 'num_1',
	x: 100,
	y: 200,
});
const opNode = flow.nodes.add({
	type: 'OperationNode',
	id: 'op_1',
	x: 300,
	y: 100,
});
const dispNode = flow.nodes.add({
	type: 'DisplayNode',
	id: 'disp_1',
	x: 500,
	y: 100,
});
const numberPort = numberNode.ports.number;
const flow2 = new Flow({ nodeTypes });
const json = flow.toJSON();

type JsonSchema = { type: string; title: string; default?: unknown };

const richMetadataNodeDefinition = defineNode({
	type: 'RichMetadataNode',
	defaultDisplayName: 'Rich Metadata',
	defaultIcon: 'sliders',
	helpText: null,
	ports: {
		labeled: definePort<
			number,
			{ readonly label: 'Brightness'; readonly category: 'appearance' }
		>({
			direction: 'in',
			metadata: { label: 'Brightness', category: 'appearance' },
		}),
		withSchema: definePort<string, { schema: JsonSchema; hidden: boolean }>({
			direction: 'in',
			metadata: {
				schema: { type: 'string', title: 'Caption', default: '' },
				hidden: true,
			},
		}),
		explicit: definePort<number, { unit: string; min: number; max: number }>({
			direction: 'out',
			metadata: { unit: 'px', min: 0, max: 100 },
		}),
		inferred: definePort({
			direction: 'out',
			initialValue: 0,
			metadata: { tag: 'computed', precision: 2 } as const,
		}),
		bare: definePort<boolean, unknown>({
			direction: 'out',
			initialValue: false,
		}),
	},
});

class RichMetadataNode extends Node<typeof richMetadataNodeDefinition> {
	public static override readonly definition = richMetadataNodeDefinition;
}

type LabeledMeta = RichMetadataNode['ports']['labeled']['metadata'];
type SchemaMeta = RichMetadataNode['ports']['withSchema']['metadata'];
type ExplicitMeta = RichMetadataNode['ports']['explicit']['metadata'];
type BareMeta = RichMetadataNode['ports']['bare']['metadata'];

declare const rich: RichMetadataNode;

const isNumber = (value: unknown): value is number => typeof value === 'number';
const isString = (value: unknown): value is string => typeof value === 'string';

const validatedNodeDefinition = defineNode({
	type: 'ValidatedNode',
	defaultDisplayName: 'Validated',
	defaultIcon: 'check',
	helpText: null,
	ports: {
		fromGuard: definePort({ direction: 'in', validate: isNumber }),
		guardWithInit: definePort({
			direction: 'in',
			validate: isNumber,
			initialValue: 42,
		}),
		guardExplicit: definePort<number>({
			direction: 'out',
			validate: isNumber,
			initialValue: 0,
		}),
		stringGuard: definePort({ direction: 'in', validate: isString }),
	},
});

class ValidatedNode extends Node<typeof validatedNodeDefinition> {
	public static override readonly definition = validatedNodeDefinition;
}

declare const validated: ValidatedNode;

const numberStdSchema: StandardSchemaV1<number, number> = {
	'~standard': {
		version: 1,
		vendor: 'test',
		validate: (value) => ({ value: value as number }),
	},
};
const stringStdSchema: StandardSchemaV1<string, string> = {
	'~standard': {
		version: 1,
		vendor: 'test',
		validate: (value) => ({ value: value as string }),
	},
};

const schemaNodeDefinition = defineNode({
	type: 'SchemaNode',
	defaultDisplayName: 'Schema',
	defaultIcon: 'brackets-curly',
	helpText: null,
	ports: {
		fromSchema: definePort({
			direction: 'in',
			schema: numberStdSchema,
		}),
		schemaWithInit: definePort({
			direction: 'out',
			schema: numberStdSchema,
			initialValue: 42,
		}),
		schemaWithMeta: definePort({
			direction: 'in',
			schema: stringStdSchema,
			metadata: { label: 'greeting' } as const,
		}),
	},
});

class SchemaNode extends Node<typeof schemaNodeDefinition> {
	public static override readonly definition = schemaNodeDefinition;
}

declare const schemaNode: SchemaNode;

const agreementNodeDefinition = defineNode({
	type: 'AgreementNode',
	defaultDisplayName: 'Agreement',
	defaultIcon: 'equals',
	helpText: null,
	ports: {
		both: definePort({
			direction: 'in',
			schema: numberStdSchema,
			validate: isNumber,
			initialValue: 10,
		}),
	},
});

class AgreementNode extends Node<typeof agreementNodeDefinition> {
	public static override readonly definition = agreementNodeDefinition;
}

declare const agreementNode: AgreementNode;

describe('node registry definitions', () => {
	test('typed node definitions preserve literals and metadata', () => {
		expect(numberInputNodeDefinition.type).type.toBe<'NumberInputNode'>();
		expect(displayNodeDefinition.ports.number.metadata).type.toBe<
			{ readonly label: 'Number to display' } | undefined
		>();
		expect(displayPortsFromDefinition.number).type.toBeAssignableTo<
			Port<number, { readonly label: 'Number to display' }>
		>();
		expect(
			displayPortsFromDefinition.number.metadata.label,
		).type.toBe<'Number to display'>();
	});

	test('flow is parameterized by the registry', () => {
		expect(flow).type.toBeAssignableTo<Flow<Registry>>();
	});
});

describe('flow node creation', () => {
	test('valid node additions return typed node instances', () => {
		expect(numberNode).type.toBe<NumberInputNode>();

		flow.nodes.add({
			type: 'NumberInputNode',
			id: 'num_2',
			x: 0,
			y: 0,
			ports: {
				number: { value: 42 },
			},
		});

		expect(opNode).type.toBe<OperationNode>();
		expect(dispNode).type.toBe<DisplayNode>();
		expect(
			dispNode.ports.number.metadata.label,
		).type.toBe<'Number to display'>();
	});

	test('invalid node additions raise type errors', () => {
		expect(flow.nodes.add).type.not.toBeCallableWith({
			type: 'NonExistentNode',
			id: 'bad_1',
			x: 0,
			y: 0,
		});

		expect(flow.nodes.add).type.not.toBeCallableWith({
			type: 'NumberInputNode',
			id: 'bad_2',
			x: 0,
			y: 0,
			ports: {
				nonExistentPort: { value: 1 },
			},
		});

		expect(flow.nodes.add).type.not.toBeCallableWith({
			type: 'NumberInputNode',
			id: 'bad_3',
			x: 0,
			y: 0,
			ports: {
				number: { value: 'not a number' },
			},
		});
	});
});

describe('ports and narrowing', () => {
	test('port values and node unions stay typed', () => {
		expect(numberPort).type.toBeAssignableTo<Port<number>>();
		expect(numberPort.value).type.toBe<number | null>();

		numberPort.updateValue(99);
		numberPort.connectTo(opNode.ports.numberA);
		numberPort.disconnect(opNode.ports.numberA);

		expect(opNode.ports.numberA).type.toBeAssignableTo<Port<number>>();
		expect(opNode.ports.result).type.toBeAssignableTo<Port<number>>();
		expect(flow.links.list.at(0)).type.toBe<Link | undefined>();

		for (const node of flow.nodes.list) {
			if (node.type === 'NumberInputNode') {
				expect(node).type.toBe<NumberInputNode>();
				expect(node.ports.number).type.toBeAssignableTo<Port<number>>();
			}

			if (node.type === 'OperationNode') {
				expect(node).type.toBe<OperationNode>();
				expect(node.ports.result).type.toBeAssignableTo<Port<number>>();
			}
		}
	});

	test('invalid port operations raise type errors', () => {
		expect(numberPort.updateValue).type.not.toBeCallableWith('not a number');
		expect<typeof opNode.ports>().type.not.toHaveProperty('nonExistentPort');
	});
});

describe('serialization and construction', () => {
	test('valid serialization round-trips through fromJSON', () => {
		flow2.fromJSON({ nodeInfos: json.nodes });
	});

	test('invalid serialized node data raises type errors', () => {
		expect(flow2.fromJSON).type.not.toBeCallableWith({
			nodeInfos: [
				{
					type: 'NumberInputNode',
					id: 'num_1',
					x: 0,
					y: 0,
					ports: {
						badPort: { value: 1 },
					},
				},
			],
		});

		expect(flow2.fromJSON).type.not.toBeCallableWith({
			nodeInfos: [
				{
					type: 'NumberInputNode',
					id: 'num_1',
					x: 0,
					y: 0,
					ports: {
						number: { value: 'wrong type' },
					},
				},
			],
		});
	});

	test('initialNodes at construction use the same typing as addNode', () => {
		void new Flow({
			nodeTypes,
			initialNodes: [
				{
					type: 'NumberInputNode',
					id: 'num_1',
					x: 0,
					y: 0,
					ports: { number: { value: 10 } },
				},
				{
					type: 'OperationNode',
					id: 'op_1',
					x: 300,
					y: 0,
					ports: {
						result: {
							connectedTo: [{ node: 'disp_1', port: 'number' }],
						},
					},
				},
				{
					type: 'DisplayNode',
					id: 'disp_1',
					x: 600,
					y: 0,
				},
			],
		});
	});

	test('invalid initialNodes data raises type errors', () => {
		expect(Flow).type.not.toBeConstructableWith({
			nodeTypes,
			initialNodes: [
				{
					type: 'NumberInputNode',
					id: 'num_1',
					x: 0,
					y: 0,
					ports: {
						number: { value: 'wrong type' },
					},
				},
			],
		});
	});
});

describe('port metadata inference', () => {
	test('metadata is inferred per port without widening', () => {
		expect(rich.ports.labeled.metadata.label).type.toBe<'Brightness'>();
		expect(rich.ports.labeled.metadata.category).type.toBe<'appearance'>();

		expect(rich.ports.withSchema.metadata.hidden).type.toBe<boolean>();
		expect(
			rich.ports.withSchema.metadata.schema.title,
		).type.toBeAssignableTo<string>();

		expect(rich.ports.explicit.metadata.unit).type.toBe<string>();
		expect(rich.ports.explicit.metadata.min).type.toBe<number>();
		expect(rich.ports.explicit.metadata.max).type.toBe<number>();

		expect(rich.ports.inferred.value).type.toBeAssignableTo<number | null>();
		expect(rich.ports.inferred.metadata.tag).type.toBe<'computed'>();
		expect(rich.ports.inferred.metadata.precision).type.toBe<2>();

		expect(rich.ports.bare.metadata).type.toBe<unknown>();
		expect(rich.ports.labeled.value).type.toBe<number | null>();
		expect(rich.ports.withSchema.value).type.toBe<string | null>();
		expect(rich.ports.explicit.value).type.toBe<number | null>();
		expect(rich.ports.bare.value).type.toBe<boolean | null>();
	});

	test('metadata rejects non-existent properties and cross-assignment', () => {
		expect<LabeledMeta>().type.not.toHaveProperty('foo');
		expect<SchemaMeta>().type.not.toHaveProperty('label');
		expect<ExplicitMeta>().type.not.toHaveProperty('label');
		expect<typeof rich.ports.inferred.metadata>().type.not.toHaveProperty(
			'label',
		);

		expect<SchemaMeta>().type.not.toBeAssignableTo<LabeledMeta>();
		expect<ExplicitMeta>().type.not.toBeAssignableTo<SchemaMeta>();
		expect<LabeledMeta>().type.not.toBeAssignableTo<ExplicitMeta>();
		expect<BareMeta>().type.not.toBeAssignableTo<LabeledMeta>();
	});
});

describe('validate type guards', () => {
	test('validate infers port value types from type guards', () => {
		expect(validated.ports.fromGuard.value).type.toBe<number | null>();
		expect(validated.ports.guardWithInit.value).type.toBe<number | null>();
		expect(validated.ports.guardExplicit.value).type.toBe<number | null>();
		expect(validated.ports.stringGuard.value).type.toBe<string | null>();
	});

	test('validate rejects mismatched values', () => {
		expect(definePort).type.not.toBeCallableWith({
			direction: 'in',
			validate: isNumber,
			initialValue: 'not a number',
		});

		validated.ports.fromGuard.updateValue(99);
		validated.ports.stringGuard.updateValue('hello');

		expect(validated.ports.fromGuard.updateValue).type.not.toBeCallableWith(
			'wrong',
		);

		expect(validated.ports.stringGuard.updateValue).type.not.toBeCallableWith(
			123,
		);
	});
});

describe('standard schema inference', () => {
	test('schema infers port values and preserves metadata', () => {
		expect(schemaNode.ports.fromSchema.value).type.toBe<number | null>();
		expect(schemaNode.ports.schemaWithInit.value).type.toBe<number | null>();
		expect(schemaNode.ports.schemaWithMeta.value).type.toBe<string | null>();
		expect(schemaNode.ports.schemaWithMeta.metadata).type.toBe<{
			readonly label: 'greeting';
		}>();
		expect(
			schemaNode.ports.fromSchema.schema,
		).type.toBeAssignableTo<StandardSchemaV1<any, number> | null>();
	});

	test('schema rejects incompatible initialValue and validate combinations', () => {
		expect(definePort).type.not.toBeCallableWith({
			direction: 'in',
			schema: numberStdSchema,
			initialValue: 'not a number',
		});

		expect(definePort).type.not.toBeCallableWith({
			direction: 'in',
			schema: numberStdSchema,
			validate: isString,
		});

		expect(agreementNode.ports.both.value).type.toBe<number | null>();
	});
});
