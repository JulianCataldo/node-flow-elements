import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import type WaColorPicker from '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import type { Port } from '@node-flow-elements/core/port';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import { textPortJsonSchema, textSchema } from './schemas.js';

// TODO: add "image node source" before
const canvasColorNodeDefinition = defineNode({
	type: 'NfWaCanvasColorNode',
	defaultDisplayName: 'Solid color',
	defaultIcon: 'text-aa',
	helpText: null,
	ports: {
		text: definePort<string, { schema: typeof textPortJsonSchema }>({
			direction: 'in',
			customDisplayName: 'Text',
			schema: textSchema,
			metadata: { schema: textPortJsonSchema },
		}),
		canvas: definePort<HTMLCanvasElement>({
			direction: 'out',
			customDisplayName: 'Canvas',
		}),
	},
});

export class NfWaCanvasColorNode extends Node<
	typeof canvasColorNodeDefinition
> {
	public static override readonly definition = canvasColorNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<nf-canvas-color
				_:canvasOut={this.ports.canvas}
				_:textIn={this.ports.text}
			/>
		</nf-wa-node>
	);
}

@customElement('nf-canvas-color')
export class NfWaCanvasColorElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: flex;
				flex-direction: column;
				justify-content: center;
			}

			header {
				display: flex;

				justify-content: center;
				align-items: center;
				gap: var(--wa-space-l);
				padding: var(--wa-space-s);
			}
		`,
	];

	#canvasRef = createRef<HTMLCanvasElement>();

	protected firstUpdated(): void {
		this.draw();

		reaction(
			() => [this.textIn?.lastChangeTime],
			() => {
				this.draw();
			},
		);
	}

	draw(): void {
		const canvas = this.#canvasRef.value!;

		const context = canvas.getContext('2d')!;

		context.fillStyle = this.color;

		context.font = '36px system-ui';

		context.fillRect(0, 0, canvas.width, canvas.height);

		this.canvasOut?.updateValue(canvas);
	}

	@property({ attribute: false })
	accessor canvasOut: Port<HTMLCanvasElement> | null = null;

	@property({ attribute: false }) accessor textIn: Port<string> | null = null;

	// TODO: extract to node body initial value with schema (everywhere)
	@property({ attribute: false }) accessor color: string = '#45001d';

	public override render(): HTMLTemplateResult {
		return (
			<>
				<header>
					Color
					<wa-color-picker
						value={this.color}
						// label="Select a color"
						on:wa-input={(event: Event) => {
							const value = (event.target as WaColorPicker).value;
							if (!value) return;
							this.color = value;
							this.draw();
						}}
					/>
					<wa-tag>
						<code>{this.color}</code>
					</wa-tag>
				</header>

				<canvas hidden width="250" height="250" use:ref={this.#canvasRef} />
			</>
		);
	}
}
