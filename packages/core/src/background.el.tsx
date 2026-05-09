import StyleObserver from 'style-observer';
import {
	LitElement,
	css,
	type HTMLTemplateResult,
	type PropertyValueMap,
} from 'lit';
import { ContextConsumer } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';
import { createRef } from 'lit/directives/ref.js';
import { reaction } from 'signal-utils/subtle/reaction';

import { Flow } from './flow.js';
import type { NfFlowElement as Nfe } from './flow.el.js';
import type { GenericFlow } from './types.js';

/**
 * @cssproperty [--nf-background-color=#080808]
 * @cssproperty [--nf-background-grid-lines-color=#191919]
 * @cssproperty [--nf-background-grid-line-width=1]
 * @cssproperty [--nf-background-grid-line-spacing=64]
 */
export class NfBackgroundElement extends SignalWatcher(LitElement) {
	static styles = css`
		:host {
			position: absolute;
			display: block;
			/* width: fit-content;
      height: fit-content; */

			/* HACK: (updateViewportRect) */
			overflow: hidden;

			--_nf-background-color: var(--nf-background-color, #080808);
			--_nf-background-grid-lines-color: var(
				--nf-background-grid-lines-color,
				#191919
			);
			--_nf-background-grid-dots-color: var(
				--nf-background-grid-dots-color,
				#2d2d2d
			);
			--_nf-background-grid-line-width: var(--nf-background-grid-line-width, 1);
			--_nf-background-grid-line-spacing: var(
				--nf-background-grid-line-spacing,
				64
			);
		}

		canvas {
			background: var(--_nf-background-color);
			width: 100%;
			height: 100%;
		}
	`;

	declare slot: (typeof Nfe)['SLOT']['background'];

	declare flow?: GenericFlow;

	/**
	 * Grid pattern style.
	 * @attr
	 */
	declare pattern: 'lines' | 'dots';
	/**
	 * Disable adaptive coarsening of the grid when zoomed out.
	 * @attr
	 */
	declare noRescale: boolean;
	static properties = {
		flow: { attribute: false },
		pattern: { type: String, reflect: true },
		noRescale: { type: Boolean, reflect: true, attribute: 'no-rescale' },
	};

	constructor() {
		super();
		this.pattern = 'lines';
		this.noRescale = true;
	}

	readonly #flowProvider = new ContextConsumer(this, {
		context: Flow.CONTEXT,
		subscribe: true,
	});
	get #flow(): Flow {
		const flow = this.flow || this.#flowProvider.value;
		if (!flow) throw new ReferenceError('Missing flow.');
		return flow;
	}

	readonly #canvasRef = createRef<HTMLCanvasElement>();

	#disposeReaction?: ReturnType<typeof reaction>;
	#prevFlow?: Flow;

	protected override willUpdate(changed: PropertyValueMap<this>): void {
		const currentFlow = this.#flow;
		if (currentFlow !== this.#prevFlow) {
			this.#prevFlow = currentFlow;
			this.#setupReaction();
		}

		if (changed.has('pattern') || changed.has('noRescale')) {
			this.#updateCanvas();
		}
	}

	#setupReaction(): void {
		this.#disposeReaction?.();
		this.#disposeReaction = reaction(
			() => [
				this.#flow.canvas.viewportRect.width,
				this.#flow.canvas.viewportRect.height,
				this.#flow.canvas.offsetX,
				this.#flow.canvas.offsetY,
			],
			() => this.#updateCanvas(),
		);
	}

	#styleObserver?: StyleObserver;

	override connectedCallback(): void {
		super.connectedCallback();
	}

	protected firstUpdated(): void {
		if (!this.#canvasRef.value) return;

		this.#styleObserver = new StyleObserver(() => this.#updateCanvas(), {
			properties: ['color', 'background-color'],
			targets: [this.#canvasRef.value],
		});
		this.#styleObserver.observe();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.#disposeReaction?.();

		if (!this.#canvasRef.value) return;
		this.#styleObserver?.unobserve(this.#canvasRef.value);
	}

	#updateCanvas(): void {
		const canvas = this.#canvasRef.value;
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;

		// NOTE: Available before canvas real (first) size
		const w = Math.round(this.#flow.canvas.viewportRect.width);
		const h = Math.round(this.#flow.canvas.viewportRect.height);

		if (w === 0 || h === 0 || this.#flow.canvas.scale === 0) return;

		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}

		// TODO: Live updates, too
		const spacing = Number(
			getComputedStyle(this).getPropertyValue(
				'--_nf-background-grid-line-spacing',
			),
		);
		const lineWidth = Number(
			getComputedStyle(this).getPropertyValue(
				'--_nf-background-grid-line-width',
			),
		);

		// Canvas color/bg are not used on the CSS side. It's more like a probe with
		// bridges to actual resolved CSS value. Probing CSS vars directly makes
		// them keep `light-dark` etc.
		const strokeStyle = getComputedStyle(canvas).color;
		const backgroundColor = getComputedStyle(canvas).backgroundColor;

		let step = spacing * this.#flow.canvas.scale;

		if (this.noRescale) {
			while (step < 16) step = step * 2;
		}

		if (step === 0) return;

		const left =
			0.5 - Math.ceil(canvas.width / step) * step + this.#flow.canvas.offsetX;
		const top =
			0.5 - Math.ceil(canvas.height / step) * step + this.#flow.canvas.offsetY;

		const right = 2 * canvas.width;
		const bottom = 2 * canvas.height;

		context.fillStyle = backgroundColor;
		context.fillRect(left, top, right - left, bottom - top);

		if (this.pattern === 'dots') {
			const radius = lineWidth * 2;
			context.fillStyle = strokeStyle;
			for (let x = left; x < right; x += step) {
				for (let y = top; y < bottom; y += step) {
					context.beginPath();
					context.arc(x, y, radius, 0, Math.PI * 2);
					context.fill();
				}
			}
		} else {
			context.beginPath();
			for (let x = left; x < right; x += step) {
				context.moveTo(x, top);
				context.lineTo(x, bottom);
			}
			for (let y = top; y < bottom; y += step) {
				context.moveTo(left, y);
				context.lineTo(right, y);
			}
			context.strokeStyle = strokeStyle;
			context.lineWidth = lineWidth;
			context.stroke();
		}
	}

	public override render(): HTMLTemplateResult {
		return (
			<canvas
				style:map={{
					color: `var(--_nf-background-grid-${this.pattern}-color)`,
				}}
				use:ref={this.#canvasRef}
			/>
		);
	}
}

customElements.define('nf-background', NfBackgroundElement);
