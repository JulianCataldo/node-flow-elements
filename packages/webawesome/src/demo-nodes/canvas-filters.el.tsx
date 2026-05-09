import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import { type } from 'arktype';
import { Node } from '@node-flow-elements/core/node';
import type { Port } from '@node-flow-elements/core/port';
import { defineNode, definePort } from '@node-flow-elements/core/types';

// import { numberSchema } from './schemas.js';
const blurInSchema = type(`0 <= number <= 25`);
const brightnessInSchema = type(`0 <= number <= 1000`);

const canvasFiltersNodeDefinition = defineNode({
	type: 'NfWaCanvasFiltersNode',
	defaultDisplayName: 'Filters',
	defaultIcon: 'drop-half',
	helpText: 'Cool canvas filters…',
	ports: {
		blurIn: definePort<number, { schema: Record<string, unknown> }>({
			direction: 'in',
			customDisplayName: 'Blur (px)',
			schema: brightnessInSchema,
			metadata: {
				schema: {
					default: 15,
					...(blurInSchema.toJsonSchema() as object),
				},
			},
		}),
		brightnessIn: definePort<number, { schema: Record<string, unknown> }>({
			direction: 'in',
			customDisplayName: 'Brightness (%)',
			schema: brightnessInSchema,
			metadata: {
				schema: {
					default: 75,
					...(brightnessInSchema.toJsonSchema() as object),
				},
			},
		}),
		canvasIn: definePort<HTMLCanvasElement>({
			direction: 'in',
			customDisplayName: 'Canvas',
		}),
		canvasOut: definePort<HTMLCanvasElement>({
			direction: 'out',
			customDisplayName: 'Result',
		}),
	},
});

export class NfWaCanvasFiltersNode extends Node<
	typeof canvasFiltersNodeDefinition
> {
	public static override readonly definition = canvasFiltersNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<nf-wa-canvas-filters
				_:blurIn={this.ports.blurIn}
				_:brightnessIn={this.ports.brightnessIn}
				_:canvasIn={this.ports.canvasIn}
				_:canvasOut={this.ports.canvasOut}
			/>
		</nf-wa-node>
	);
}

@customElement('nf-wa-canvas-filters')
export class NfWaCanvasFiltersElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: contents;
			}

			.render {
				width: 100%;
				display: flex;
				justify-content: center;
			}
		`,
	];

	#canvasRef = createRef<HTMLCanvasElement>();

	@property({ attribute: false })
	accessor canvasIn!: Port<HTMLCanvasElement>;

	@property({ attribute: false })
	accessor canvasOut!: Port<HTMLCanvasElement>;

	@property({ attribute: false }) accessor blurIn!: Port<number>;

	@property({ attribute: false })
	accessor brightnessIn!: Port<number>;

	protected firstUpdated(): void {
		this.draw();

		reaction(
			() => [
				this.canvasIn?.lastChangeTime,
				this.blurIn?.lastChangeTime,
				this.brightnessIn?.lastChangeTime,
			],
			() => {
				this.draw();
			},
		);
	}

	draw(): void {
		const canvas = this.#canvasRef?.value;
		const context = canvas?.getContext('2d');
		if (!context) return;

		const canvasInput = this.canvasIn;

		context.filter =
			`blur(${this.blurIn.value}px) ` +
			`brightness(${this.brightnessIn?.value}%)`;

		if (canvasInput?.value instanceof HTMLCanvasElement) {
			context.drawImage(canvasInput.value, 0, 0);

			if (canvas) this.canvasOut?.updateValue(canvas);
		}
	}

	public override render(): HTMLTemplateResult {
		return (
			<div class="render">
				<canvas width="250" height="250" use:ref={this.#canvasRef} />
			</div>
		);
	}
}
