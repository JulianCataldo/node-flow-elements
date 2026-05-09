/* eslint-disable @typescript-eslint/no-explicit-any */

import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { Flow } from './flow.js';
import { type NfHandleElement } from './handle.el.js';
import { type NfNodeElement } from './node.el.js';
import { Node } from './node.js';
import { type NfPortElement } from './port.el.js';
import type { Port } from './port.js';
// import type { Inlet, Outlet } from './port.js';

export type Link = {
	from: Port;
	to: Port;
};
export type ConnectingLink = {
	from: Port;
	to: Port | null;
};

// type NodeConstructor = { x; y; id?: string };

export type Coordinates = { x: number; y: number };

// export type SerializableResult<Ctor extends Ctor = Ctor> = Partial<
//   ReturnType<Ctor['prototype']['toJSON']>
// >;

export type FlowConstructorParameters<
	Registry extends NodeRegistry = NodeRegistry,
> = {
	id?: string;
	nodeTypes?: Registry;
	initialNodes?: NodeInitOf<Registry>[];
	menu?: MenuItem[];
};

export type NodeConstructorParameters<_Node extends Node = Node> = {
	flow: Flow<any>;
	data?: NodeSerializableOptions<_Node>;
};

export type PortSerializationOptions<PortMetadata = unknown> = Pick<
	Port,
	'direction'
> &
	Partial<Pick<Port, 'customDisplayName'>> &
	PortMetadata;

export type Validate<T = unknown> = (value: unknown) => value is T;
export type AddPortOptions<
	Type = any,
	PortMetadata = any,
> = PortSerializationOptions & {
	validate?: Validate<Type>;
	schema?: StandardSchemaV1<any, Type>;
	initialValue?: Type;
	metadata?: PortMetadata;
};

export type PortDefinition<Type = any, PortMetadata = any> = Pick<
	AddPortOptions<Type, PortMetadata>,
	| 'customDisplayName'
	| 'direction'
	| 'initialValue'
	| 'metadata'
	| 'schema'
	| 'validate'
>;

export type NodePortDefinitions = Record<string, PortDefinition<any, any>>;

type PortValueFromDefinition<Definition> =
	Definition extends PortDefinition<infer Value, any> ? Value : unknown;

type PortMetadataFromDefinition<Definition> =
	Definition extends PortDefinition<any, infer Metadata> ? Metadata : unknown;

export type PortInstancesFromDefinitions<
	Definitions extends NodePortDefinitions,
> = {
	[Name in keyof Definitions]: Port<
		PortValueFromDefinition<Definitions[Name]>,
		PortMetadataFromDefinition<Definitions[Name]>
	>;
};

export type PortDirection = 'in' | 'out' | 'both';

// export type Port = Inlet | Outlet;

// export type PortConstructionData = Partial<ReturnType<Port['toJSON']>>;

export const PZ_EVENT = {
	panstart: 'panstart',
	pan: 'pan',
	panend: 'panend',
	zoom: 'zoom',
	zoomend: 'zoomend',
	transform: 'transform',
} as const;

export interface Offset {
	x: number;
	y: number;
}

export interface MenuItem {
	displayName?: string;
	icon?: string;
	label?: boolean;
	children?: MenuItem[];

	nodeCtor?: NodeClass;
}

export function isNodeElement(element: EventTarget): element is NfNodeElement {
	return NODE in element;
}
export function isHandleElement(
	element: EventTarget,
): element is NfHandleElement {
	return HANDLE in element;
}
export function isPortElement(element: EventTarget): element is NfPortElement {
	return PORT in element;
}

/** Extract value type from a Port instance. */
type PortValue<P> = P extends Port<infer V, any> ? V : unknown;

export type NodeSerializableOptions<
	_Node extends Node = Node,
	Data extends Record<string, unknown> = Record<string, unknown>,
> = Pick<Node, 'x' | 'y' | 'id'> &
	Partial<Pick<Node, 'zIndex' | 'customDisplayName' | 'type'>> &
	Data & {
		ports?: Partial<{
			[key in keyof _Node['ports']]: {
				value?: PortValue<_Node['ports'][key]>;
				connectedTo?: { node: string; port: string }[];
			};
		}>;
	};

export type NodeDefinition<
	Ports extends NodePortDefinitions = NodePortDefinitions,
	Type extends string = string,
> = {
	type: Type;
	defaultDisplayName: string;
	defaultIcon: string;
	helpText: string | null;
	ports: Ports;
};

export type NodeClass<
	Definition extends NodeDefinition = NodeDefinition,
	_Node extends Node<Definition> = Node<Definition>,
> = (new (...arguments_: any[]) => _Node) & {
	readonly definition: Definition;
};

export function definePort<Type = any, PortMetadata = any>(
	definition: PortDefinition<Type, PortMetadata>,
): PortDefinition<Type, PortMetadata> {
	return definition;
}

export function defineNode<
	const Type extends string,
	const Ports extends NodePortDefinitions,
>(definition: NodeDefinition<Ports, Type>): NodeDefinition<Ports, Type> {
	return definition;
}

export type GenericFlow = Flow<any>;

export type GenericNode = Node<NodeDefinition>;
export type GenericPort = Port<any, any>;

// ----- Node Registry & Init Types -----

/** A registry mapping type keys to Node subclass constructors. */

export type NodeRegistry = Record<string, NodeClass>;

/**
 * @deprecated Use `NodeRegistry` instead.
 */
export type NodeList = NodeRegistry;

/** Serializable init shape for a single node, discriminated on `type`. */
export type NodeInitOf<
	Registry extends NodeRegistry,
	K extends keyof Registry = keyof Registry,
> = K extends keyof Registry
	? { type: K } & NodeSerializableOptions<InstanceType<Registry[K]>>
	: never;

/**
 * @deprecated Use `NodeInitOf` instead.
 */
export type NodeType<
	_Registry extends NodeRegistry = NodeRegistry,
	_K extends keyof _Registry = keyof _Registry,
> = NodeInitOf<_Registry, _K>;

// NOTE: EXPERIMENTAL

// type Link<
//   B extends (typeof initialNodes)[number] = (typeof initialNodes)[number],
//   C extends keyof InstanceType<
//     (typeof nodeTypes)[keyof typeof nodeTypes]
//   >['ports'] = keyof InstanceType<
//     (typeof nodeTypes)[keyof typeof nodeTypes]
//   >['ports'],
// > = {
//   id: string;
//   from: {
//     node: B['id'];
//     port: C;
//   };
// };

// const initialLinks: Link[] = [
//   {
//     id: 'test',
//     from: { node: 'hey', port: 'number' },
//     to: { node: 'op', port: 'numberA' },
//   },
//   {
//     id: 'test2',
//     from: { node: 'op', port: 'number' },
//     to: { node: 'op', port: 'numberAb' },
//   },
// ];

export const FLOW_SLOT = {
	background: 'background',
	bgInteractive: 'background-interactive',
	foreground: 'foreground',
	fgInteractive: 'foreground-interactive',
} as const;
export type FlowSlot = (typeof FLOW_SLOT)[keyof typeof FLOW_SLOT];

export const HANDLE = Symbol('HANDLE');

export const NODE = Symbol('NODE');

export const PORT = Symbol('PORT');

export interface DefaultNodePorts {
	input: Port<any, any>;
	output: Port<any, any>;
}

export type AnyNodePorts = Record<string, Port<any, any>>;

/** Derive the union of all node instances in a registry. */
export type RegistryNode<R extends NodeRegistry> = InstanceType<R[keyof R]>;
type PortsOfNode<NodeType extends Node> = NodeType extends Node
	? NodeType['ports'][keyof NodeType['ports']]
	: never;
export type RegistryPort<R extends NodeRegistry> = PortsOfNode<RegistryNode<R>>;

export type SelectionRectangle = {
	start: Coordinates;
	current: Coordinates;
};

export type SelectionBounds = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};

export type ViewportBoundsCanvas = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};
