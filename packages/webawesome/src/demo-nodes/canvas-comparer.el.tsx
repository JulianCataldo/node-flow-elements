import '@awesome.me/webawesome/dist/components/comparison/comparison.js';

import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import type { Port } from '@node-flow-elements/core/port';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

const canvasComparerNodeDefinition = defineNode({
	type: 'NfWaCanvasComparerNode',
	defaultDisplayName: 'A/B Comparer',
	defaultIcon: 'split-horizontal',
	helpText: null,
	ports: {
		canvasBefore: definePort<HTMLCanvasElement>({
			direction: 'in',
			customDisplayName: 'Before',
		}),
		canvasAfter: definePort<HTMLCanvasElement>({
			direction: 'in',
			customDisplayName: 'After',
		}),
	},
});

export class NfWaCanvasComparerNode extends Node<
	typeof canvasComparerNodeDefinition
> {
	public static override readonly definition = canvasComparerNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<nf-wa-canvas-comparer
				_:canvasBeforeIn={this.ports.canvasBefore}
				_:canvasAfterIn={this.ports.canvasAfter}
			/>
		</nf-wa-node>
	);
}

@customElement('nf-wa-canvas-comparer')
export class NfWaCanvasComparerElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: flex;
				justify-content: center;
				align-items: center;
			}
		`,
	];

	#canvasBeforeRef = createRef<HTMLCanvasElement>()!;
	#canvasAfterRef = createRef<HTMLCanvasElement>()!;

	@property({ attribute: false })
	accessor canvasBeforeIn!: Port<HTMLCanvasElement>;

	@property({ attribute: false })
	accessor canvasAfterIn!: Port<HTMLCanvasElement>;

	@state() accessor blurFactor = 5;

	protected firstUpdated(): void {
		this.draw();
		reaction(
			() => [
				this.canvasAfterIn.lastChangeTime,
				this.canvasBeforeIn.lastChangeTime,
			],
			() => this.draw(),
		);
	}

	draw(): void {
		if (this.canvasBeforeIn?.value instanceof HTMLCanvasElement) {
			const canvasBeforeOut = this.#canvasBeforeRef.value;
			const contextBeforeOut = canvasBeforeOut?.getContext('2d');

			if (contextBeforeOut) {
				const canvasBeforeIn = this.canvasBeforeIn?.value;
				contextBeforeOut.drawImage(canvasBeforeIn, 0, 0);
			}
		}
		if (this.canvasAfterIn?.value instanceof HTMLCanvasElement) {
			const canvasAfterOut = this.#canvasAfterRef.value;
			const contextAfterOut = canvasAfterOut?.getContext('2d');

			if (contextAfterOut) {
				const canvasAfterIn = this.canvasAfterIn?.value;

				contextAfterOut.drawImage(canvasAfterIn, 0, 0);
			}
		}
	}

	public override render(): HTMLTemplateResult {
		return (
			<wa-comparison style="--handle-size: 2rem">
				<canvas
					use:ref={this.#canvasBeforeRef}
					slot="after"
					width="250"
					height="250"
				/>
				<canvas
					use:ref={this.#canvasAfterRef}
					slot="before"
					width="250"
					height="250"
				/>
			</wa-comparison>
		);
	}
}
