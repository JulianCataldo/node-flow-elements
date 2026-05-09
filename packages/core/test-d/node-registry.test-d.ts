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

import {
	expectAssignable,
	expectError,
	expectNotAssignable,
	expectType,
} from 'tsd';

import { Flow } from '../src/flow.js';
import { Node } from '../src/node.js';
import type { Port } from '../src/port.js';
import {
	defineNode,
	definePort,
	type Link,
	type PortInstancesFromDefinitions,
} from '../src/types.js';
import type { StandardSchemaV1 } from '@standard-schema/spec';

// ============================================================================
// MARK: 1. Define custom nodes with typed ports
// ============================================================================

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

	// This node needs extra data at init time.
	// Implementation TBD (static member, fromJSON override, etc.)
	// But the Flow API must enforce it.
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

expectType<'NumberInputNode'>(numberInputNodeDefinition.type);
expectType<{ readonly label: 'Number to display' } | undefined>(
	displayNodeDefinition.ports.number.metadata,
);

type DisplayPortsFromDefinition = PortInstancesFromDefinitions<
	typeof displayNodeDefinition.ports
>;
declare const displayPortsFromDefinition: DisplayPortsFromDefinition;

expectAssignable<Port<number, { readonly label: 'Number to display' }>>(
	displayPortsFromDefinition.number,
);
expectType<'Number to display'>(
	displayPortsFromDefinition.number.metadata.label,
);

// ============================================================================
// MARK: 2. Create a node registry
// ============================================================================

const nodeTypes = {
	NumberInputNode,
	OperationNode,
	DisplayNode,
} as const;

type Registry = typeof nodeTypes;

// ============================================================================
// MARK: 3. Instantiate a Flow from the registry
// ============================================================================

const flow = new Flow({ nodeTypes });

// Flow should be parameterized by the registry
expectAssignable<Flow<Registry>>(flow);

// ============================================================================
// MARK: 4. addNode — discriminated by `type` key
// ============================================================================

// ---- POSITIVE: Valid node additions ----

// Basic node — only required fields
const numberNode = flow.nodes.add({
	type: 'NumberInputNode',
	id: 'num_1',
	x: 100,
	y: 200,
});

// The returned value should be an instance of NumberInputNode
expectType<NumberInputNode>(numberNode);

// With port init data
flow.nodes.add({
	type: 'NumberInputNode',
	id: 'num_2',
	x: 0,
	y: 0,
	ports: {
		number: { value: 42 },
	},
});

// Operation node
const opNode = flow.nodes.add({
	type: 'OperationNode',
	id: 'op_1',
	x: 300,
	y: 100,
});
expectType<OperationNode>(opNode);

// Display node
const dispNode = flow.nodes.add({
	type: 'DisplayNode',
	id: 'disp_1',
	x: 500,
	y: 100,
});
expectType<DisplayNode>(dispNode);

// Port metadata is typed per-port — label is the narrow literal, not string or any
expectType<'Number to display'>(dispNode.ports.number.metadata.label);

// ---- NEGATIVE: Invalid node additions ----

// Unknown type key — should error
expectError(
	flow.nodes.add({
		type: 'NonExistentNode',
		id: 'bad_1',
		x: 0,
		y: 0,
	}),
);

// Wrong port key for NumberInputNode (has "number", not "nonExistentPort")
expectError(
	flow.nodes.add({
		type: 'NumberInputNode',
		id: 'bad_2',
		x: 0,
		y: 0,
		ports: {
			nonExistentPort: { value: 1 },
		},
	}),
);

// Wrong port value type (number port given a string)
expectError(
	flow.nodes.add({
		type: 'NumberInputNode',
		id: 'bad_3',
		x: 0,
		y: 0,
		ports: {
			number: { value: 'not a number' },
		},
	}),
);

// ============================================================================
// MARK: 5. Port manipulation — fully typed
// ============================================================================

// Port access on the returned node is typed by port key
const numberPort = numberNode.ports.number;
expectAssignable<Port<number>>(numberPort);

// Port value is typed
expectType<number | null>(numberPort.value);

// updateValue is typed
numberPort.updateValue(99);
expectError(numberPort.updateValue('not a number'));
numberPort.connectTo(opNode.ports.numberA);
numberPort.disconnect(opNode.ports.numberA);

// Operation node ports
expectAssignable<Port<number>>(opNode.ports.numberA);
expectAssignable<Port<number>>(opNode.ports.result);

// Non-existent port key is a type error
// @ts-expect-error - "nonExistentPort" doesn't exist on OperationNode
opNode.ports.nonExistentPort;

// Flow-level links list — each Link has typed from/to ports
expectType<Link | undefined>(flow.links.list.at(0));

// Accessing nodes from flow.nodes.list

// flow.nodes.list contains the union of all possible node types
const _nodes = flow.nodes.list;
for (const node of _nodes) {
	// `type` discriminator narrows the node type
	if (node.type === 'NumberInputNode') {
		expectType<NumberInputNode>(node);
		expectAssignable<Port<number>>(node.ports.number);
	}
	if (node.type === 'OperationNode') {
		expectType<OperationNode>(node);
		expectAssignable<Port<number>>(node.ports.result);
	}
}

// ============================================================================
// MARK: 6. Serialization round-trip
// ============================================================================

// toJSON + fromJSON should round-trip with type checking
const json = flow.toJSON();

const flow2 = new Flow({ nodeTypes });
flow2.fromJSON({ nodeInfos: json.nodes });

// ---- NEGATIVE: Bad deserialization data ----

// Wrong port key in serialized data
expectError(
	flow2.fromJSON({
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
	}),
);

// Wrong value type in serialized port data
expectError(
	flow2.fromJSON({
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
	}),
);

// ============================================================================
// MARK: 7. initialNodes at construction — same type safety as addNode
// ============================================================================

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

// ---- NEGATIVE: Bad initial nodes ----

expectError(
	new Flow({
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
	}),
);

// ============================================================================
// MARK: 8. Per-port metadata — heterogeneous, inferred, type-safe
// ============================================================================

// TS limitation: `definePort<Type>({ metadata: ... })` loses metadata typing
// because partial type-argument inference isn't supported.
// Two patterns that DO work:
//   A) Both generics explicit: `definePort<ValueType, MetaType>({ metadata: ... })`
//   B) Zero generics (all inferred): `definePort({ value: ..., metadata: ... })`

// ---- A node where every port carries different metadata ----

type JsonSchema = { type: string; title: string; default?: unknown };

const richMetadataNodeDefinition = defineNode({
	type: 'RichMetadataNode',
	defaultDisplayName: 'Rich Metadata',
	defaultIcon: 'sliders',
	helpText: null,
	ports: {
		// Pattern A: both generics explicit, narrow literal via `as const` in the generic
		labeled: definePort<
			number,
			{ readonly label: 'Brightness'; readonly category: 'appearance' }
		>({
			direction: 'in',
			metadata: { label: 'Brightness', category: 'appearance' },
		}),

		// Pattern A: both generics explicit, wider types (no literal narrowing)
		withSchema: definePort<string, { schema: JsonSchema; hidden: boolean }>({
			direction: 'in',
			metadata: {
				schema: { type: 'string', title: 'Caption', default: '' },
				hidden: true,
			},
		}),

		// Pattern A: both generics explicit, structural metadata
		explicit: definePort<number, { unit: string; min: number; max: number }>({
			direction: 'out',
			metadata: { unit: 'px', min: 0, max: 100 },
		}),

		// Pattern B: zero generics — both Value and Meta inferred from args
		inferred: definePort({
			direction: 'out',
			initialValue: 0,
			metadata: { tag: 'computed', precision: 2 } as const,
		}),

		// No metadata at all — should be `unknown`
		bare: definePort<boolean, unknown>({
			direction: 'out',
			initialValue: false,
		}),
	},
});

class RichMetadataNode extends Node<typeof richMetadataNodeDefinition> {
	public static override readonly definition = richMetadataNodeDefinition;
}

declare const rich: RichMetadataNode;

// ---- Pattern A: explicit narrow literal metadata ----

// `label` is the literal "Brightness", not string
expectType<'Brightness'>(rich.ports.labeled.metadata.label);

// `category` is the literal "appearance"
expectType<'appearance'>(rich.ports.labeled.metadata.category);

// Non-existent key is an error
// @ts-expect-error — no `foo` on labeled metadata
rich.ports.labeled.metadata.foo;

// ---- Pattern A: wider schema metadata ----

expectType<boolean>(rich.ports.withSchema.metadata.hidden);
expectAssignable<string>(rich.ports.withSchema.metadata.schema.title);

// @ts-expect-error — no `label` on withSchema metadata
rich.ports.withSchema.metadata.label;

// ---- Pattern A: structural metadata ----

expectType<string>(rich.ports.explicit.metadata.unit);
expectType<number>(rich.ports.explicit.metadata.min);
expectType<number>(rich.ports.explicit.metadata.max);

// @ts-expect-error — can't access non-existent key
rich.ports.explicit.metadata.label;

// ---- Pattern B: zero generics, everything inferred ----

// Value type remains numeric via the inferred definition
expectAssignable<number | null>(rich.ports.inferred.value);

// Metadata inferred with `const` narrowing
expectType<'computed'>(rich.ports.inferred.metadata.tag);
expectType<2>(rich.ports.inferred.metadata.precision);

// @ts-expect-error — no `label` on inferred metadata
rich.ports.inferred.metadata.label;

// ---- Bare port (no metadata) ----

expectType<unknown>(rich.ports.bare.metadata);

// metadata is `unknown` — accessing properties is an error
// @ts-expect-error — unknown has no properties
rich.ports.bare.metadata.anything;

// ---- Value types are still correct alongside metadata ----

expectType<number | null>(rich.ports.labeled.value);
expectType<string | null>(rich.ports.withSchema.value);
expectType<number | null>(rich.ports.explicit.value);
expectType<boolean | null>(rich.ports.bare.value);

// ---- Cross-port: metadata types are independent ----

type LabeledMeta = RichMetadataNode['ports']['labeled']['metadata'];
type SchemaMeta = RichMetadataNode['ports']['withSchema']['metadata'];
type ExplicitMeta = RichMetadataNode['ports']['explicit']['metadata'];
type BareMeta = RichMetadataNode['ports']['bare']['metadata'];

// These are all distinct types — none assignable to each other
expectNotAssignable<LabeledMeta>({} as SchemaMeta);
expectNotAssignable<SchemaMeta>({} as ExplicitMeta);
expectNotAssignable<ExplicitMeta>({} as LabeledMeta);
expectNotAssignable<LabeledMeta>({} as BareMeta);

// ============================================================================
// MARK: 9. Validate as type guard — infers port Value type
// ============================================================================

// A type guard validator: `(value: unknown) => value is number`
const isNumber = (v: unknown): v is number => typeof v === 'number';
const isString = (v: unknown): v is string => typeof v === 'string';

const validatedNodeDefinition = defineNode({
	type: 'ValidatedNode',
	defaultDisplayName: 'Validated',
	defaultIcon: 'check',
	helpText: null,
	ports: {
		// validate alone — Type inferred from the guard
		fromGuard: definePort({ direction: 'in', validate: isNumber }),

		// validate + initialValue aligned — both agree on `number`
		guardWithInit: definePort({
			direction: 'in',
			validate: isNumber,
			initialValue: 42,
		}),

		// validate + explicit generic — both agree
		guardExplicit: definePort<number>({
			direction: 'out',
			validate: isNumber,
			initialValue: 0,
		}),

		// string guard
		stringGuard: definePort({ direction: 'in', validate: isString }),
	},
});

class ValidatedNode extends Node<typeof validatedNodeDefinition> {
	public static override readonly definition = validatedNodeDefinition;
}

declare const validated: ValidatedNode;

// ---- Type inferred from validate guard ----

// fromGuard: validate is `(v) => v is number` → Port<number, ...>
expectType<number | null>(validated.ports.fromGuard.value);

// guardWithInit: same, both agree
expectType<number | null>(validated.ports.guardWithInit.value);

// guardExplicit: explicit generic matches guard
expectType<number | null>(validated.ports.guardExplicit.value);

// stringGuard: validate is `(v) => v is string` → Port<string, ...>
expectType<string | null>(validated.ports.stringGuard.value);

// ---- NEGATIVE: mismatched validate + initialValue ----

// validate says `number`, initialValue is a string → error
expectError(
	definePort({
		direction: 'in',
		validate: isNumber,
		initialValue: 'not a number', // string !== number
	}),
);

// ---- updateValue respects guard-inferred type ----

validated.ports.fromGuard.updateValue(99);
expectError(validated.ports.fromGuard.updateValue('wrong'));

validated.ports.stringGuard.updateValue('hello');
expectError(validated.ports.stringGuard.updateValue(123));

// ============================================================
// 10. Standard Schema port inference
// ============================================================

// A minimal StandardSchemaV1 implementation for testing
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

// ---- Type inferred from schema ----

const schemaNodeDefinition = defineNode({
	type: 'SchemaNode',
	defaultDisplayName: 'Schema',
	defaultIcon: 'brackets-curly',
	helpText: null,
	ports: {
		// schema alone → Type inferred from StandardSchemaV1 output
		fromSchema: definePort({
			direction: 'in',
			schema: numberStdSchema,
		}),

		// schema + initialValue: both agree
		schemaWithInit: definePort({
			direction: 'out',
			schema: numberStdSchema,
			initialValue: 42,
		}),

		// schema + metadata: schema infers Type, metadata inferred separately
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

// fromSchema: StandardSchemaV1<number, number> → Port<number, ...>
expectType<number | null>(schemaNode.ports.fromSchema.value);

// schemaWithInit: schema infers number, initialValue 42 agrees
expectType<number | null>(schemaNode.ports.schemaWithInit.value);

// schemaWithMeta: schema infers string, metadata is separate
expectType<string | null>(schemaNode.ports.schemaWithMeta.value);
expectType<{ readonly label: 'greeting' }>(
	schemaNode.ports.schemaWithMeta.metadata,
);

// ---- Schema stored on Port ----

expectType<StandardSchemaV1<any, number> | null>(
	schemaNode.ports.fromSchema.schema,
);

// ---- NEGATIVE: schema + initialValue mismatch ----

expectError(
	definePort({
		direction: 'in',
		schema: numberStdSchema,
		initialValue: 'not a number', // string !== number
	}),
);

// ---- NEGATIVE: schema + validate mismatch ----

expectError(
	definePort({
		direction: 'in',
		schema: numberStdSchema,
		validate: isString, // string !== number
	}),
);

// ---- POSITIVE: schema + validate agree ----

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
expectType<number | null>(agreementNode.ports.both.value);
