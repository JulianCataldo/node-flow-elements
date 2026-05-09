/* eslint-disable unicorn/prevent-abbreviations */
import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { reaction } from 'signal-utils/subtle/reaction';
import { SignalWatcher } from '@lit-labs/signals';
import { Node } from '@node-flow-elements/core/node';
import type { Port } from '@node-flow-elements/core/port';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import { textPortJsonSchema, textSchema } from './schemas.js';

// TODO: add "image node source" before
const canvasTextNodeDefinition = defineNode({
	type: 'NfWaCanvasTextNode',
	defaultDisplayName: 'Text',
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

export class NfWaCanvasTextNode extends Node<typeof canvasTextNodeDefinition> {
	public static override readonly definition = canvasTextNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<nf-canvas-text
				_:canvasOut={this.ports.canvas}
				_:textIn={this.ports.text}
			/>
		</nf-wa-node>
	);
}

@customElement('nf-canvas-text')
export class NfWaCanvasTextElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: flex;
				justify-content: center;
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

		context.clearRect(0, 0, canvas.width, canvas.height);

		context.font = '24px system-ui';

		context.fillStyle = getComputedStyle(
			document.documentElement,
		).getPropertyValue('--wa-color-brand-90');

		const text = this.textIn?.value || '<…Empty…>';
		const lines = NfWaCanvasTextElement.#wrapText(text, 14);
		const lineHeight = 30;
		const startY = 30;
		for (const [i, line] of lines.entries()) {
			context.fillText(line, 10, startY + i * lineHeight);
		}

		this.canvasOut?.updateValue(canvas);
	}

	static #wrapText(text: string, maxChars: number): string[] {
		const result: string[] = [];
		for (const paragraph of text.split('\n')) {
			if (paragraph.length <= maxChars) {
				result.push(paragraph);
				continue;
			}
			const words = paragraph.split(' ');
			let current = '';
			for (const word of words) {
				if (current.length === 0) {
					current = word;
				} else if (current.length + 1 + word.length <= maxChars) {
					current += ' ' + word;
				} else {
					result.push(current);
					current = word;
				}
			}
			if (current) result.push(current);
		}
		return result;
	}

	@property({ attribute: false })
	accessor canvasOut: Port<HTMLCanvasElement> | null = null;

	@property({ attribute: false }) accessor textIn: Port<string> | null = null;

	public override render(): HTMLTemplateResult {
		return <canvas use:ref={this.#canvasRef} width="250" height="250" />;
	}
}
