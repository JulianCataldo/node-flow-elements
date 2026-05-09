/* eslint-disable prefer-rest-params */

import { signal, computed } from '@lit-labs/signals';

import { Node } from './node.js';
import { MissingNode } from './missing-node.js';
import type {
	Coordinates,
	GenericFlow,
	NodeInitOf,
	NodeRegistry,
	RegistryNode,
} from './types.js';
import { findFreePosition } from './helpers/find-free-position.js';
import type { FlowCanvasHandler } from './flow-canvas-handler.js';

type DispatchFunction = (
	method: string,
	arguments_: IArguments | undefined,
) => void;

type FlowNodeContext<R extends NodeRegistry> = {
	nodeTypes: R;
	flow: GenericFlow;
	dispatch: DispatchFunction;
	canvas: FlowCanvasHandler;
};

export class FlowNodeHandler<R extends NodeRegistry = NodeRegistry> {
	readonly #dispatch: DispatchFunction;
	readonly #canvas: FlowCanvasHandler;
	readonly #nodeTypes: R;
	readonly #flow: GenericFlow;

	constructor(context: FlowNodeContext<R>) {
		this.#dispatch = context.dispatch;
		this.#canvas = context.canvas;
		this.#nodeTypes = context.nodeTypes;
		this.#flow = context.flow;
	}

	// MARK: Node list

	public readonly $list = signal<RegistryNode<R>[]>([]);
	public get list(): RegistryNode<R>[] {
		return this.$list.get();
	}

	public get isDraggingAny(): boolean {
		return this.list.some((node) => node.isDragging);
	}

	#findFreePosition(
		x: number,
		y: number,
		estimatedWidth?: number,
		estimatedHeight?: number,
	): Coordinates {
		return findFreePosition({
			x,
			y,
			estimatedWidth,
			estimatedHeight,
			nodes: this.list.map((n) => ({
				x: n.x,
				y: n.y,
				width: n.width,
				height: n.height,
			})),
			viewport: this.#canvas.viewportBoundsCanvas,
		});
	}

	public add<K extends keyof R>(
		node: NodeInitOf<R, K>,
		options?: { avoidOverlap?: boolean },
	): InstanceType<R[K]> {
		const CustomNode =
			node.type === 'Node' || node.type === undefined
				? Node
				: this.#nodeTypes[node.type as keyof R];

		if (!CustomNode) {
			// The requested type is absent from the registry.  Rather than throwing,
			// materialise a MissingNode placeholder so the rest of the flow (and its
			// wiring) can still be restored.
			const missingType = String(node.type);
			const placeholderData =
				options?.avoidOverlap === false
					? node
					: { ...node, ...this.#findFreePosition(node.x, node.y) };

			const placeholder = new MissingNode({
				flow: this.#flow,
				data: placeholderData,
				missingType,
			});

			this.select(placeholder);
			this.$list.set([...this.list, placeholder] as RegistryNode<R>[]);
			this.#dispatch('addNode', arguments);

			return placeholder as unknown as InstanceType<R[K]>;
		}

		if (options?.avoidOverlap !== false) {
			const free = this.#findFreePosition(node.x, node.y);
			node = { ...node, ...free };
		}

		const createdNode = new CustomNode({
			flow: this.#flow,
			data: { ...node, zIndex: this.list.length },
		});

		this.select(createdNode);
		this.$list.set([...this.list, createdNode] as RegistryNode<R>[]);
		this.#dispatch('addNode', arguments);

		return createdNode as InstanceType<R[K]>;
	}

	// MARK: Selection

	public readonly $selected = signal<Node[]>([]);
	public get selected(): Node[] {
		return this.$selected.get();
	}

	public readonly $selectedNode = computed(
		// eslint-disable-next-line unicorn/consistent-function-scoping
		(): Node | null => this.$selected.get().at(-1) ?? null,
	);
	public get selectedNode(): Node | null {
		return this.$selectedNode.get();
	}

	public get hasSelected(): boolean {
		return this.selected.length > 0;
	}

	public isSelected(node: Node): boolean {
		return this.selected.includes(node);
	}

	public clearSelected(): void {
		if (this.selected.length === 0) return;
		this.$selected.set([]);
	}

	public deselect(node: Node): void {
		if (!this.isSelected(node)) return;
		this.$selected.set(this.selected.filter((c) => c !== node));
	}

	public selectMany(nodes: Node[], options?: { bringToFront?: boolean }): void {
		const nextSelected = [...new Set(nodes)];

		if (nextSelected.length === 0) {
			this.clearSelected();
			return;
		}

		const isSame =
			nextSelected.length === this.selected.length &&
			nextSelected.every((n) => this.selected.includes(n));
		if (isSame) return;

		if (options?.bringToFront) {
			let nextZIndex =
				Math.max(-1, ...this.list.map((c) => c.zIndex ?? -1)) + 1;
			for (const node of nextSelected) {
				node.updateZIndex(nextZIndex);
				nextZIndex += 1;
			}
		}

		this.$selected.set(nextSelected);
	}

	public select(node: Node): void {
		this.selectMany([node], { bringToFront: true });
	}

	public deleteSelected(): void {
		const selected = [...this.selected];
		if (selected.length === 0) return;
		for (const node of selected) node.delete();
	}

	public clear(): void {
		this.clearSelected();
		this.#canvas.clearSelectionRectangle();
		this.$list.set([]);
		this.#dispatch('clearNodes', arguments);
	}
}
