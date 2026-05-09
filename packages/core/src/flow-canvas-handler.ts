/* eslint-disable prefer-rest-params */
import type { PanZoom } from 'panzoom';
import { signal } from '@lit-labs/signals';

import type {
	Coordinates,
	SelectionBounds,
	SelectionRectangle,
	ViewportBoundsCanvas,
} from './types.js';

type DispatchFunction = (
	method: string,
	arguments_: IArguments | undefined,
) => void;

type FlowCanvasContext = {
	dispatch: DispatchFunction;
};

export class FlowCanvasHandler {
	readonly #dispatch: DispatchFunction;

	constructor(context: FlowCanvasContext) {
		this.#dispatch = context.dispatch;
	}

	// MARK: Offset

	public readonly $offsetX = signal(0);
	public get offsetX(): number {
		return this.$offsetX.get();
	}
	public readonly $offsetY = signal(0);
	public get offsetY(): number {
		return this.$offsetY.get();
	}

	public updateOffset(x: number, y: number): void {
		this.$offsetX.set(x);
		this.$offsetY.set(y);
		this.#dispatch('updateOffset', arguments);
	}

	// MARK: Scale

	public readonly $scale = signal(1);
	public get scale(): number {
		return this.$scale.get();
	}

	public updateScale(factor: number): void {
		this.$scale.set(factor);
		this.#dispatch('updateScale', arguments);
	}

	// MARK: Drag / zoom state

	public readonly $isDragging = signal(false);
	public get isDragging(): boolean {
		return this.$isDragging.get();
	}
	public setIsDragging(state: boolean): void {
		this.$isDragging.set(state);
	}

	public readonly $isZooming = signal(false);
	public get isZooming(): boolean {
		return this.$isZooming.get();
	}
	public setIsZooming(state: boolean): void {
		this.$isZooming.set(state);
	}

	// MARK: Panzoom

	public panzoom?: PanZoom;

	public zoom(direction: 'in' | 'out'): void {
		if (!this.panzoom) return;
		this.panzoom.smoothZoom(
			this.viewportRect.width / 2,
			this.viewportRect.height / 2,
			direction === 'in' ? 1.3 : 0.7,
		);
		this.#dispatch('zoom', arguments);
	}

	public resetOffset(smooth?: boolean): void {
		this.updateOffset(0, 0);
		if (smooth) this.panzoom?.smoothMoveTo(0, 0);
		else this.panzoom?.moveTo(0, 0);
	}

	public resetScale(smooth?: boolean): void {
		const x = this.viewportRect.x / 2;
		const y = this.viewportRect.y / 2;
		this.updateScale(1);
		if (smooth) this.panzoom?.smoothZoomAbs(x, y, 1);
		else this.panzoom?.zoomAbs(x, y, 1);
	}

	public resetViewport(smooth: boolean = false): void {
		this.resetOffset(smooth);
		this.resetScale(smooth);
		// HACK: Doing it twice…
		this.resetOffset(smooth);
		this.resetScale(smooth);
	}

	// MARK: Viewport rect

	public readonly $viewportRect = signal({ width: 0, height: 0, x: 0, y: 0 });
	public get viewportRect(): {
		width: number;
		height: number;
		x: number;
		y: number;
	} {
		return this.$viewportRect.get();
	}

	public updateViewportRect({
		rect,
		scroll,
	}: {
		rect: FlowCanvasHandler['viewportRect'];
		scroll: Coordinates;
	}): void {
		this.$viewportRect.set({
			width: rect.width,
			height: rect.height,
			x: rect.x + scroll.x,
			y: rect.y + scroll.y,
		});
		this.#dispatch('updateViewportRect', arguments);
	}

	public get isCentered(): boolean {
		return (
			this.scale === 1 &&
			this.offsetX === this.viewportRect.width / 2 &&
			this.offsetY === this.viewportRect.height / 2
		);
	}

	// MARK: Mouse

	public readonly $mouseX = signal<number | null>(0);
	public get mouseX(): number | null {
		return this.$mouseX.get();
	}
	public readonly $mouseY = signal<number | null>(0);
	public get mouseY(): number | null {
		return this.$mouseY.get();
	}

	public updateMousePosition(coords: {
		x: number | null;
		y: number | null;
	}): void {
		this.$mouseX.set(coords.x);
		this.$mouseY.set(coords.y);
	}

	public get mouseXScaled(): number | null {
		if (!this.mouseX) return null;
		return this.mouseX - this.offsetX / this.scale;
	}
	public get mouseYScaled(): number | null {
		if (!this.mouseY) return null;
		return this.mouseY - this.offsetY / this.scale;
	}

	// MARK: Selection rectangle

	public readonly $selectionRectangle = signal<SelectionRectangle | null>(null);
	public get selectionRectangle(): SelectionRectangle | null {
		return this.$selectionRectangle.get();
	}

	public get isSelectingNodes(): boolean {
		return this.selectionRectangle !== null;
	}

	public get selectionRectangleBounds(): SelectionBounds | null {
		const sel = this.selectionRectangle;
		if (!sel) return null;
		return {
			left: Math.min(sel.start.x, sel.current.x),
			top: Math.min(sel.start.y, sel.current.y),
			right: Math.max(sel.start.x, sel.current.x),
			bottom: Math.max(sel.start.y, sel.current.y),
		};
	}

	public startSelectionRectangle(start: Coordinates): void {
		this.$selectionRectangle.set({ start, current: start });
	}

	public updateSelectionRectangle(current: Coordinates): void {
		const sel = this.selectionRectangle;
		if (!sel) return;
		this.$selectionRectangle.set({ ...sel, current });
	}

	public clearSelectionRectangle(): void {
		if (!this.selectionRectangle) return;
		this.$selectionRectangle.set(null);
	}

	// MARK: Viewport bounds in model (canvas) coordinates

	public get viewportBoundsCanvas(): ViewportBoundsCanvas {
		return {
			left: -this.offsetX / this.scale,
			top: -this.offsetY / this.scale,
			right: (this.viewportRect.width - this.offsetX) / this.scale,
			bottom: (this.viewportRect.height - this.offsetY) / this.scale,
		};
	}
}
