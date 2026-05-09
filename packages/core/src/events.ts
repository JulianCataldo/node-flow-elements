/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FlowCanvasHandler } from './flow-canvas-handler.js';
import type { FlowGuiHandler } from './flow-gui-handler.js';
import type { FlowLinkHandler } from './flow-link-handler.js';
import type { FlowNodeHandler } from './flow-node-handler.js';
import type { Flow } from './flow.js';
import type { Node } from './node.js';
import type { Port } from './port.js';

export type NodeFlowEventSuperType = 'Flow' | 'Node' | 'Port';

export type NodeFlowEventListenerType = 'changed';

type NodeEvent = ExtractMethods<Node>;
type PortEvent = ExtractMethods<Port>;
type FlowEvent =
	| ExtractMethods<Flow>
	// FIXME: Incorrect extraction
	| ExtractMethods<FlowCanvasHandler>
	| ExtractMethods<FlowNodeHandler>
	| ExtractMethods<FlowGuiHandler>
	| ExtractMethods<FlowLinkHandler>;

type PickMatching<T, V> = {
	[K in keyof T as T[K] extends V ? K : never]: T[K];
};
type ExtractMethods<T> = PickMatching<T, (...arguments_: any) => any>;

export type NfEventDetail<
	_N extends NodeEvent = NodeEvent,
	_P extends PortEvent = PortEvent,
	_F extends FlowEvent = FlowEvent,
> = {
	id: string;
	args: unknown;
} & (
	| {
			type: 'Node';
			instance: Node;
			method: keyof _N;
	  }
	| {
			type: 'Port';
			instance: Port;
			method: keyof _P;
	  }
	| {
			type: 'Flow';
			instance: Flow;
			method: keyof _F;
	  }
);

export class NfEvent extends CustomEvent<NfEventDetail> {
	constructor(
		type: NodeFlowEventListenerType,
		options: { detail: NfEventDetail },
	) {
		super(type, options);
	}
}

export class NodeFlowEventTarget extends EventTarget {
	listen(
		callback: {
			(event: NfEvent['detail']): void;
		},
		aborter = new AbortController(),
	): AbortController {
		this.addEventListener(
			'changed' satisfies NodeFlowEventListenerType,
			(event) => callback((event as NfEvent).detail),
			{ signal: aborter.signal },
		);
		return aborter;
	}

	public dispatching = true;

	public dispatch(
		method: string,
		arguments_: IArguments | unknown[] | undefined,
		instance: Port<any, any> | Flow<any> | Node,
	): void {
		if (!this.dispatching) return;

		const detail: NfEventDetail = {
			id: instance.id,
			type: instance.superType,
			method,
			instance,
			args: [...((arguments_ as unknown[]) || [])],
		} as NfEventDetail;

		this.dispatchEvent(new NfEvent('changed', { detail }));
	}
}

/**
 * Methods whose effects should be persisted / synced across peers.
 * Everything else is ephemeral UI state (drag, hover, mouse, viewport…).
 */
export const PERSISTENT_METHODS: ReadonlySet<string> = new Set([
	// Flow
	'addNode',
	'clearNodes',
	// Node
	'updatePosition',
	'updateZIndex',
	'updateDisplayName',
	'delete',
	// Port
	'updateValue',
	'connectTo',
	'disconnect',

	'autoLayout',
]);

/** Returns `true` when the event represents a state change worth persisting. */
export function isPersistentEvent(detail: NfEvent['detail']): boolean {
	return PERSISTENT_METHODS.has(detail.method as string);
}

export function serializeEvent(detail: NfEvent['detail']): {
	type: 'Node' | 'Port' | 'Flow' | 'unknown';
	id: string;
	method: unknown;
	args: unknown;
} {
	return {
		type: detail.type,
		id: detail.id,
		method: detail.method,
		args: detail.args,
	};
}

/**
 * Replay a serialized event on a target Flow.
 *
 * This is the original 1:1 method mirror used for cross-tab BroadcastChannel
 * sync. It finds the target instance (Flow / Node / Port) by id and calls
 * `method(...args)` on it with `flow.dispatching = false` so the call does
 * not echo back through the event bus.
 *
 * Not a domain change feed — for higher-level diffing/sync use
 * `bindEntityLifecycle` and the Port/Flow signals directly.
 */
export function loadSerializedEvent(flow: Flow, data: NfEventDetail): void {
	const wasDispatching = flow.dispatching;
	flow.dispatching = false;
	try {
		const arguments_ = Array.isArray(data.args) ? data.args : [];
		if (data.type === 'Flow') {
			const method = (flow as any)[data.method as string];
			if (typeof method === 'function') method.apply(flow, arguments_);
			return;
		}
		if (data.type === 'Node') {
			const node = flow.nodes.list.find((n) => n.id === data.id);
			if (!node) return;
			const method = (node as any)[data.method as string];
			if (typeof method === 'function') method.apply(node, arguments_);
			return;
		}
		if (data.type === 'Port') {
			const port = flow.links.ports.find((p) => p.id === data.id);
			if (!port) return;
			const method = (port as any)[data.method as string];
			if (typeof method === 'function') method.apply(port, arguments_);
			return;
		}
	} finally {
		flow.dispatching = wasDispatching;
	}
}

// export function dispatch(
//   value: (..._arguments: any) => any,
//   context: ClassMethodDecoratorContext,
// ) {
//   if (context.kind === 'method') {
//     return function (this: Node | Port | Flow, ..._arguments: any): any {
//       const returnValue = value.call(this, ..._arguments);

//       ('flow' in this ? this.flow : this).dispatch(
//         context.name.toString(),
//         _arguments || [],
//         this,
//       );

//       return returnValue;
//     };
//   }
// }
