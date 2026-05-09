import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import type { Port } from '@node-flow-elements/core/port';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

const canvasMixerNodeDefinition = defineNode({
	type: 'NfWaCanvasMixerNode',
	defaultDisplayName: 'Mixer',
	defaultIcon: 'cube-transparent',
	helpText: null,
	ports: {
		canvasAIn: definePort<HTMLCanvasElement>({
			direction: 'in',
			customDisplayName: 'Canvas A',
		}),
		canvasBIn: definePort<HTMLCanvasElement>({
			direction: 'in',
			customDisplayName: 'Canvas B',
		}),
		canvasOut: definePort<HTMLCanvasElement>({
			direction: 'out',
			customDisplayName: 'Result',
		}),
	},
});

export class NfWaCanvasMixerNode extends Node<
	typeof canvasMixerNodeDefinition
> {
	public static override readonly definition = canvasMixerNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<wf-canvas-mixer
				_:canvasAIn={this.ports.canvasAIn}
				_:canvasBIn={this.ports.canvasBIn}
				_:canvasOut={this.ports.canvasOut}
			/>
		</nf-wa-node>
	);
}

@customElement('wf-canvas-mixer')
export class NfWaCanvasMixerElement extends SignalWatcher(LitElement) {
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
	accessor canvasAIn: Port<HTMLCanvasElement> | null = null;

	@property({ attribute: false })
	accessor canvasBIn: Port<HTMLCanvasElement> | null = null;

	@property({ attribute: false })
	accessor canvasOut: Port<HTMLCanvasElement> | null = null;

	protected firstUpdated(): void {
		this.draw();

		reaction(
			() => [this.canvasAIn?.lastChangeTime, this.canvasBIn?.lastChangeTime],
			() => {
				this.draw();
			},
		);
	}

	draw(): void {
		const canvas = this.#canvasRef?.value;
		const context = canvas?.getContext('2d');

		const canvasA = this.canvasAIn;
		const canvasB = this.canvasBIn;

		if (
			context &&
			canvasA?.value instanceof HTMLCanvasElement &&
			canvasB?.value instanceof HTMLCanvasElement
		) {
			context.drawImage(canvasA.value, 0, 0);

			context.drawImage(canvasB.value, 0, 0);

			if (canvas) this.canvasOut?.updateValue(canvas);
		}
	}

	public override render(): HTMLTemplateResult {
		return (
			<div class="render">
				<canvas use:ref={this.#canvasRef} width="250" height="250" />
			</div>
		);
	}
}
