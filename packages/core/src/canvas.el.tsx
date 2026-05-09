import { LitElement, type HTMLTemplateResult, type PropertyValues } from 'lit';
import { createRef } from 'lit/directives/ref.js';
import panzoom from 'panzoom';
import { SignalWatcher } from '@lit-labs/signals';

import { Flow } from './flow.js';
import styles from './canvas.css' with { type: 'css' };
import { PZ_EVENT } from './types.js';
import { CanvasPointerHandler } from './canvas.el-pointer-handler.js';

import './handle.el.js';
import './port.el.js';

export class NfCanvasElement extends SignalWatcher(LitElement) {
	static styles = styles;

	static override properties = { flow: { attribute: false } };
	declare public flow: Flow;

	#panzoomInnerRef = createRef<HTMLDivElement>();
	#panzoomWrapperRef = createRef<HTMLDivElement>();
	#pointer!: CanvasPointerHandler;

	protected override willUpdate(changed: PropertyValues<this>): void {
		if (
			changed.has('flow') &&
			this.flow && // Dispose old panzoom if switching flows
			this.flow.canvas.panzoom
		)
			this.flow.canvas.panzoom.dispose();
	}

	protected override updated(changed: PropertyValues<this>): void {
		if (changed.has('flow') && this.flow) {
			this.#pointer = new CanvasPointerHandler(
				this.flow,
				this,
				() => this.#panzoomWrapperRef.value,
				() => this.#panzoomInnerRef.value,
			);
			this.#setupPanZoom();
			this.#observeResize();
		}
	}

	#setupPanZoom(): void {
		this.flow.canvas.panzoom = panzoom(this.#panzoomInnerRef.value!, {
			// TODO: Parametrize some options, via CSS or JS props?
			beforeMouseDown: (event: MouseEvent) =>
				event.altKey || this.flow.canvas.isSelectingNodes,
			disableKeyboardInteraction: true,
			minZoom: 0.05,
			maxZoom: 10,
			zoomSpeed: 0.25,
			// initialX: this.flow.initial.x,
			// initialY: this.flow.initial.y,
			// initialZoom: this.flow.initial.zoom,
			// bounds: true,
			// autocenter: true,
		});
		this.flow.canvas.panzoom.on(PZ_EVENT.panstart, () =>
			this.flow.canvas.setIsDragging(true),
		);
		this.flow.canvas.panzoom.on(PZ_EVENT.panend, () =>
			this.flow.canvas.setIsDragging(false),
		);
		// FIXME:
		// this.flow.canvas.panzoom.on(PZ_EVENT.zoom, () =>
		//   this.flow.canvas.setIsZooming(true),
		// );
		// this.flow.canvas.panzoom.on(PZ_EVENT.zoomend, () =>
		//   this.flow.canvas.setIsZooming(false),
		// );
		this.flow.canvas.panzoom.on(PZ_EVENT.transform, () => {
			if (!this.flow.canvas.panzoom) return;
			const transform = this.flow.canvas.panzoom.getTransform();

			this.flow.canvas.updateOffset(transform.x, transform.y);
			this.flow.canvas.updateScale(transform.scale);
		});
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this.flow.canvas.panzoom) this.flow.canvas.panzoom.dispose();
	}

	#observeResize(): void {
		const observer = new ResizeObserver(() => this.#updateViewportRect());
		observer.observe(this.#panzoomWrapperRef.value!);

		this.#updateViewportRect();
	}

	#updateViewportRect(): void {
		const rect = this.#panzoomWrapperRef.value?.getBoundingClientRect();
		if (!rect) return;

		const scroll = { x: window.scrollX, y: window.scrollY };
		this.flow.canvas.updateViewportRect({ rect, scroll });
	}

	public static readonly SLOT_NAMES = {
		background: 'background',
		foreground: 'foreground',
	} as const;

	render(): HTMLTemplateResult {
		const selectionBounds = this.flow.canvas.selectionRectangleBounds;

		return (
			<div
				use:ref={this.#panzoomWrapperRef}
				class:list={[
					'wrapper',
					this.flow.canvas.isDragging && 'is-dragging',
					this.flow.nodes.isDraggingAny && 'is-dragging-node',
					this.flow.canvas.isSelectingNodes && 'is-selecting-nodes',
					this.flow.links.connecting && 'is-connecting-port',
				]}
				on:pointerdown={(event) => this.#pointer.handleDown(event)}
				on:pointermove={(event) => this.#pointer.handleMove(event)}
				on:pointerup={(event) => this.#pointer.handleUp(event)}
				on:pointerover={(event) => this.#pointer.handleEnter(event)}
				on:pointerout={(event) => this.#pointer.handleLeave(event)}
				on:dblclick={(event) => this.#pointer.handleDoubleClick(event)}
				on:contextmenu={(event) => this.#pointer.handleContextMenu(event)}
			>
				<div use:ref={this.#panzoomInnerRef}>
					<slot name={NfCanvasElement.SLOT_NAMES.background} />

					<slot
						// NOTE: Prevents PanZooms.
						on:dblclick={(event) => event.stopPropagation()}
						on:mousedown={(event) => event.stopPropagation()}
						on:mouseup={(event) => event.stopPropagation()}
						on:keydown={(event) => event.stopPropagation()}
					/>

					<slot name={NfCanvasElement.SLOT_NAMES.foreground} />
				</div>

				{selectionBounds ? (
					<div
						class="selection-rectangle"
						style:map={{
							left: `${selectionBounds.left}px`,
							top: `${selectionBounds.top}px`,
							width: `${selectionBounds.right - selectionBounds.left}px`,
							height: `${selectionBounds.bottom - selectionBounds.top}px`,
						}}
					/>
				) : null}
			</div>
		);
	}
}
customElements.define('nf-interactive-canvas', NfCanvasElement);
