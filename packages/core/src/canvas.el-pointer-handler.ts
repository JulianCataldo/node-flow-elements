import {
	isHandleElement,
	isNodeElement,
	isPortElement,
	type Offset,
} from './types.js';
import type { Flow } from './flow.js';
import type { Port } from './port.js';
import type { Node } from './node.js';

type NodeDragPointerData = {
	id: number;
	mode: 'drag-node';
	currentPos: Offset;
	primaryNode: Node;
	nodes: Node[];
	wasDragged: boolean;
};

type SelectionPointerData = {
	id: number;
	mode: 'select-nodes';
	currentPos: Offset;
};

type PointerData = NodeDragPointerData | SelectionPointerData;

export class CanvasPointerHandler {
	readonly #flow: Flow;
	readonly #hostEl: Element;
	readonly #wrapperEl: () => HTMLDivElement | undefined;
	readonly #innerEl: () => HTMLDivElement | undefined;

	readonly #pointerMap: Map<number, PointerData> = new Map();

	constructor(
		flow: Flow,
		hostElement: Element,
		wrapperElement: () => HTMLDivElement | undefined,
		innerElement: () => HTMLDivElement | undefined,
	) {
		this.#flow = flow;
		this.#hostEl = hostElement;
		this.#wrapperEl = wrapperElement;
		this.#innerEl = innerElement;
	}

	#repositionMouseUnderCursor(event: PointerEvent): void {
		const rect = this.#hostEl.getBoundingClientRect();
		this.#flow.canvas.updateMousePosition({
			x: (event.clientX - rect.x) / this.#flow.canvas.scale,
			y: (event.clientY - rect.y) / this.#flow.canvas.scale,
		});
	}

	#eventOffsetWithinViewport(event: PointerEvent): Offset | null {
		const rect = this.#wrapperEl()?.getBoundingClientRect();
		if (!rect) return null;

		return { x: event.clientX - rect.x, y: event.clientY - rect.y };
	}

	#syncRectangleSelection(): void {
		const selectionBounds = this.#flow.canvas.selectionRectangleBounds;
		if (!selectionBounds) return;

		const wrapperRect = this.#wrapperEl()?.getBoundingClientRect();
		if (!wrapperRect) return;

		const selectedNodes = [...this.#hostEl.querySelectorAll('nf-node')]
			.filter((el) => isNodeElement(el))
			.filter((nodeElement) => {
				const rect = nodeElement.getBoundingClientRect();

				const left = rect.left - wrapperRect.left;
				const top = rect.top - wrapperRect.top;
				const right = rect.right - wrapperRect.left;
				const bottom = rect.bottom - wrapperRect.top;

				return (
					left >= selectionBounds.left &&
					top >= selectionBounds.top &&
					right <= selectionBounds.right &&
					bottom <= selectionBounds.bottom
				);
			})
			.map((nodeElement) => nodeElement.node);

		this.#flow.nodes.selectMany(selectedNodes);
	}

	#startRectangleSelection(event: PointerEvent): void {
		const viewportOffset = this.#eventOffsetWithinViewport(event);
		if (!viewportOffset) return;

		event.preventDefault();

		this.#flow.nodes.clearSelected();
		this.#flow.canvas.startSelectionRectangle(viewportOffset);
		this.#wrapperEl()?.setPointerCapture(event.pointerId);

		this.#pointerMap.set(event.pointerId, {
			id: event.pointerId,
			mode: 'select-nodes',
			currentPos: { x: event.clientX, y: event.clientY },
		});
	}

	#advanceRectangleSelection(event: PointerEvent): void {
		const viewportOffset = this.#eventOffsetWithinViewport(event);
		if (!viewportOffset) return;

		this.#flow.canvas.updateSelectionRectangle(viewportOffset);
		this.#syncRectangleSelection();
	}

	handleDown(event: PointerEvent): void {
		if (event.button !== 0 || !(event.target instanceof Element)) return;

		const paths = event.composedPath();

		const portElement = paths.find((element) => isPortElement(element));
		if (portElement?.port) {
			this.#repositionMouseUnderCursor(event);
			this.#flow.links.setConnecting(portElement.port as Port);
			return;
		}

		const nodeElement = paths.find((element) => isNodeElement(element));
		if (!nodeElement) {
			// TODO: alt+shift+drag => additive rectangle selection (adds to existing selection rather than replacing).
			// Needs experiment: should plain alt+drag also become additive when nodes are already selected? Or always replace?
			if (event.altKey) this.#startRectangleSelection(event);
			return;
		}

		const handleElement = paths.find((element) => isHandleElement(element));
		if (!handleElement) {
			// TODO: shift+click (and/or option+click?) => toggle single node in/out of selection without
			// clearing others. Needs UX experiment — option may conflict with alt+drag rectangle on some platforms.
			this.#flow.nodes.select(nodeElement.node);
			return;
		}

		const keepGroupSelection =
			nodeElement.node.isSelected && this.#flow.nodes.selected.length > 1;
		if (!keepGroupSelection) this.#flow.nodes.select(nodeElement.node);

		const draggedNodes = keepGroupSelection
			? [...this.#flow.nodes.selected]
			: [nodeElement.node];

		event.target.setPointerCapture(event.pointerId);

		this.#pointerMap.set(event.pointerId, {
			id: event.pointerId,
			mode: 'drag-node',
			currentPos: { x: event.clientX, y: event.clientY },
			primaryNode: nodeElement.node,
			nodes: draggedNodes,
			wasDragged: false,
		});

		for (const node of draggedNodes) node.setIsDragging(true);
	}

	handleMove(event: PointerEvent): void {
		if (this.#flow.links.connecting) this.#repositionMouseUnderCursor(event);

		const saved = this.#pointerMap.get(event.pointerId);
		if (!saved) return;

		const current = { ...saved.currentPos };
		saved.currentPos = { x: event.clientX, y: event.clientY };

		if (saved.mode === 'select-nodes') {
			this.#advanceRectangleSelection(event);
			return;
		}

		const delta = {
			x: (saved.currentPos.x - current.x) / this.#flow.canvas.scale,
			y: (saved.currentPos.y - current.y) / this.#flow.canvas.scale,
		};

		saved.wasDragged = true;
		for (const node of saved.nodes)
			node.updatePosition({ x: node.x + delta.x, y: node.y + delta.y });
	}

	handleUp(event: PointerEvent): void {
		const paths = event.composedPath();
		const portElement = paths.find((element) => isPortElement(element));

		if (this.#flow.links.connecting) {
			if (portElement?.port)
				this.#flow.links.connecting.from.connectTo(portElement.port);

			this.#flow.links.setConnecting(null);
		}

		const saved = this.#pointerMap.get(event.pointerId);
		if (!saved) return;

		if (saved.mode === 'select-nodes') {
			this.#advanceRectangleSelection(event);
			this.#flow.canvas.clearSelectionRectangle();
			this.#pointerMap.delete(event.pointerId);
			return;
		}

		if (!saved.wasDragged) this.#flow.nodes.select(saved.primaryNode);

		for (const node of saved.nodes) node.setIsDragging(false);
		this.#pointerMap.delete(event.pointerId);
	}

	handleEnter(event: PointerEvent): void {
		const nodeElement = event.composedPath().find((el) => isNodeElement(el));
		if (nodeElement) nodeElement.node.setIsHovering(true);
	}

	handleLeave(event: PointerEvent): void {
		const nodeElement = event.composedPath().find((el) => isNodeElement(el));
		if (nodeElement) nodeElement.node.setIsHovering(false);
	}

	handleDoubleClick(event: MouseEvent): void {
		const paths = event.composedPath();
		if (
			paths.some((el) => isPortElement(el)) ||
			paths.some((el) => isNodeElement(el)) ||
			paths.some((el) => isHandleElement(el))
		)
			event.stopPropagation();
	}

	handleContextMenu(event: MouseEvent): void {
		const element = event.composedPath().at(0);
		if (element !== this.#innerEl() && element !== this.#wrapperEl()) return;

		event.preventDefault();

		const x =
			event.clientX +
			window.scrollX +
			(event.clientX > 125 ? -105 : 25) -
			this.#flow.canvas.viewportRect.x;
		const y =
			event.clientY +
			window.scrollY +
			(event.clientY < 125 ? 25 : -15) -
			this.#flow.canvas.viewportRect.y;

		this.#flow.gui.setContextMenuPosition({ x, y });
		this.#flow.gui.setIsContextMenuVisible(true);
	}
}
