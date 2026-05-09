import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { SignalWatcher } from '@lit-labs/signals';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

const noteNodeDefinition = defineNode({
	type: 'NfWaNoteNode',
	defaultDisplayName: 'Sticky note',
	defaultIcon: 'note',
	helpText: null,
	ports: {
		text: definePort<string, { hidden: true }>({
			direction: 'in',
			metadata: { hidden: true },
		}),
	},
});

export class NfWaNoteNode extends Node<typeof noteNodeDefinition> {
	public static override readonly definition = noteNodeDefinition;

	// NOTE: beware those custom settings are not persisted
	// @signal accessor textContent = '';

	// public updateTextContent(text: string): void {
	//   this.textContent = text;
	// }

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<nf-wa-note
				// _:updateContent={this.updateTextContent}
				_:textContent={this.ports.text.value ?? 'Empty…'}
			/>
		</nf-wa-node>
	);
}

@customElement('nf-wa-note')
export class NfWaNoteElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: contents;
			}

			.wrapper {
				padding: var(--wa-space-xs);
			}
		`,
	];

	#textAreaRef = createRef<WaTextarea>();

	// TODO: Sync (save)
	// TODO: extract to node body initial value with schema (everywhere)
	@property({ attribute: false }) accessor textContent: string = '';

	public override render(): HTMLTemplateResult {
		return (
			<div class="wrapper">
				<wa-textarea
					use:ref={this.#textAreaRef}
					resize="both"
					value={this.textContent}
				/>
			</div>
		);
	}
}
