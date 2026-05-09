import { signal, computed } from '@lit-labs/signals';

import type { Port } from './port.js';
import type {
	ConnectingLink,
	Link,
	NodeRegistry,
	RegistryPort,
} from './types.js';
import type { FlowCanvasHandler } from './flow-canvas-handler.js';
import type { FlowNodeHandler } from './flow-node-handler.js';

type FlowLinkContext<R extends NodeRegistry> = {
	canvas: FlowCanvasHandler;
	nodes: FlowNodeHandler<R>;
};

export class FlowLinkHandler<R extends NodeRegistry = NodeRegistry> {
	readonly #canvas: FlowCanvasHandler;
	readonly #nodes: FlowNodeHandler<R>;

	constructor(context: FlowLinkContext<R>) {
		this.#canvas = context.canvas;
		this.#nodes = context.nodes;
	}

	// MARK: Links (derived from node ports)

	public readonly $list = computed<Link[]>(() => {
		const links: Link[] = [];
		for (const node of this.#nodes.$list.get())
			for (const port of Object.values(node.ports) as Port[]) {
				if (port.direction === 'in') continue;
				for (const to of port.connectedTo)
					if (to.direction !== 'out') links.push({ from: port, to });
			}
		return links;
	});
	public get list(): Link[] {
		return this.$list.get();
	}

	// MARK: Ports (all ports across all nodes)

	public readonly $ports = computed<RegistryPort<R>[]>(() => {
		const ports: RegistryPort<R>[] = [];
		for (const node of this.#nodes.$list.get())
			for (const port of Object.values(node.ports))
				ports.push(port as RegistryPort<R>);
		return ports;
	});
	public get ports(): RegistryPort<R>[] {
		return this.$ports.get();
	}

	// MARK: In-progress connecting link

	public readonly $connecting = signal<ConnectingLink | null>(null);
	public get connecting(): ConnectingLink | null {
		return this.$connecting.get();
	}

	public setConnecting(from: Port | null = null, to: Port | null = null): void {
		this.$connecting.set(from ? { from, to } : null);
	}

	// MARK: Selected port

	public readonly $selectedPort = signal<Port | null>(null);
	public get selectedPort(): Port | null {
		return this.$selectedPort.get();
	}

	/**
	 * Programmatically select a port (e.g. to open its editor popup).
	 * Pass `null` to deselect. Node implementations react to `port.isSelected`
	 * to materialise selection however they choose.
	 */
	public selectPort(port: Port | null): void {
		this.$selectedPort.set(port);
	}

	// MARK: SVG path generation

	public makeSvgPath(link: ConnectingLink): string {
		const ws = this.#canvas.viewportRect;
		const to = link.to || {
			x: this.#canvas.mouseXScaled ?? link.from.x,
			y: this.#canvas.mouseYScaled ?? link.from.y,
		};

		const controlPoint =
			Math.max(15, Math.min(Math.abs(to.x - link.from.x) / 1.5, 500)) *
			// FIXME:
			(link.from.direction === 'in' ? -1 : 1);

		return (
			`M ${link.from.x - ws.x} ` +
			`${link.from.y - ws.y} ` +
			`C ${link.from.x + controlPoint - ws.x} ` +
			`${link.from.y - ws.y}, ` +
			`${to.x - controlPoint - ws.x} ` +
			`${to.y - ws.y} ${to.x - ws.x} ` +
			`${to.y - ws.y}`
		);
	}
}
