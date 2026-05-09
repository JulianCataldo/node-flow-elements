import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';
import { Flow } from '@node-flow-elements/core/flow';
import type { NfFlowElement as Nfe } from '@node-flow-elements/core/flow.el';

import styles from './center.css' with { type: 'css' };

@customElement('nf-wa-center')
export class NfWaCenterElement extends SignalWatcher(LitElement) {
	static styles = styles;

	declare slot: (typeof Nfe)['SLOT']['bgInteractive'];

	protected _flowConsumer = new ContextConsumer(this, {
		context: Flow.CONTEXT,
		subscribe: true,
		callback: (value) => (this.flow = value),
	});
	@property({ attribute: false })
	accessor flow!: Flow;

	public override render(): HTMLTemplateResult {
		return (
			<div
				class="center"
				style:map={{
					// TODO: Calculate based on nodes coalesced barycenter
					'--x': `${1920 / 2}px`,
					'--y': `${1080 / 2}px`,
				}}
			>
				<wa-icon name="crosshair" />
			</div>
		);
	}
}
