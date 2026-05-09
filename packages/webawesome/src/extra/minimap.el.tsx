import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { ContextConsumer } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import type { NfFlowElement as Nfe } from '@node-flow-elements/core/flow.el';
import { Flow } from '@node-flow-elements/core/flow';
import type { Node } from '@node-flow-elements/core/node';

import styles from './minimap.css' with { type: 'css' };

@customElement('nf-wa-minimap')
export class NfWaMinimapElement extends SignalWatcher(LitElement) {
	static styles = styles;

	declare slot: (typeof Nfe)['SLOT']['foreground'];

	protected _flowConsumer = new ContextConsumer(this, {
		context: Flow.CONTEXT,
		subscribe: true,
		callback: (value) => (this.flow = value),
	});
	@property({ attribute: false })
	accessor flow!: Flow;

	#canvasRef = createRef<HTMLCanvasElement>();

	@property({ attribute: false }) accessor scale = 10;
	@property({ type: Number }) accessor width = 256;
	@property({ type: Number }) accessor height = 256;

	protected updated(): void {
		this.updateCanvas();
	}

	public override firstUpdated(): void {
		reaction(
			() => [
				this.flow.canvas.viewportRect,
				this.flow.canvas.offsetX,
				this.flow.canvas.offsetY,
				this.flow.canvas.scale,
				this.flow.nodes.list.map((node) => [node.x, node.y, node.zIndex]),
			],

			() => this.updateCanvas(),
		);
	}

	updateCanvas = (): void => {
		const canvas = this.#canvasRef.value!;

		const context = canvas.getContext('2d');
		if (!context) return;

		context.clearRect(0, 0, canvas.width, canvas.height);

		const sortedNodes = [...this.flow.nodes.list].sort((a: Node, b: Node) =>
			(a.zIndex ?? 0) < (b.zIndex ?? 0) ? -1 : 1,
		);
		for (const node of sortedNodes) {
			// return;
			context.strokeStyle = 'grey';
			context.fillStyle = node.isSelected ? 'white' : 'lightgrey';

			context.beginPath();
			context.roundRect(
				((node.x +
					this.flow.canvas.offsetX +
					this.flow.canvas.viewportRect.width / 2) *
					this.flow.canvas.scale) /
					this.scale,
				((node.y +
					this.flow.canvas.offsetY +
					this.flow.canvas.viewportRect.height / 2) *
					this.flow.canvas.scale) /
					this.scale,
				(node.width * this.flow.canvas.scale) / this.scale,
				(node.height * this.flow.canvas.scale) / this.scale,
				2 * ((this.flow.canvas.scale * this.scale) / 10),
			);
			context.stroke();
			context.fill();
		}
	};

	render(): HTMLTemplateResult {
		return (
			<div
				class:list={[
					'wrapper',
					this.flow.canvas.isDragging && 'is-dragging-canvas',
				]}
				style:map={{ width: `${this.width}px`, height: `${this.height}px` }}
			>
				<div
					class:list={[
						'coords',
						(this.flow.gui.isContextMenuVisible ||
							this.flow.canvas.isZooming ||
							this.flow.canvas.isDragging ||
							this.flow.gui.isCoordinatesVisible) &&
							'is-visible',
					]}
				>
					<wa-tag size="s">
						X: {Math.round(this.flow.canvas.offsetX).toString()}
					</wa-tag>
					<wa-tag size="s">
						Y: {Math.round(this.flow.canvas.offsetY).toString()}
					</wa-tag>
					<wa-tag size="s">
						Z: {Math.round(this.flow.canvas.scale * 1000) / 1000}
					</wa-tag>
				</div>

				<canvas
					width={this.width}
					height={this.height}
					use:ref={this.#canvasRef}
					on:contextmenu={(event) => event.preventDefault()}
				/>
			</div>
		);
	}
}
