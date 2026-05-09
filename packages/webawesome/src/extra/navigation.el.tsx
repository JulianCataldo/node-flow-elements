import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';
import { Flow } from '@node-flow-elements/core/flow';
import type { NfFlowElement as Nfe } from '@node-flow-elements/core/flow.el';

import styles from './navigation.css' with { type: 'css' };

@customElement('nf-wa-navigation')
export class NfWaNavigationElement extends SignalWatcher(LitElement) {
	static styles = styles;

	declare slot: (typeof Nfe)['SLOT']['foreground'];

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
				class:list={[
					'navigation-overlay',
					this.flow.canvas.isCentered === false &&
						this.flow.canvas.isDragging === false &&
						'is-visible',
				]}
			>
				<wa-button
					appearance="filled-outlined"
					class="toggle-coordinates"
					on:click={() =>
						this.flow.gui.setIsCoordinatesVisible(
							!this.flow.gui.isCoordinatesVisible,
						)
					}
					size="s"
				>
					<wa-icon name="info" />
				</wa-button>

				<wa-button
					appearance="filled-outlined"
					class="zoom-in"
					on:click={() => this.flow.canvas.zoom('in')}
					size="s"
				>
					<wa-icon name="magnifying-glass-plus" />
				</wa-button>

				<wa-button
					appearance="filled-outlined"
					class="zoom-out"
					on:click={() => this.flow.canvas.zoom('out')}
					size="s"
				>
					<wa-icon name="magnifying-glass-minus" />
				</wa-button>

				<wa-button
					appearance="filled-outlined"
					class="center-viewport"
					on:click={() => this.flow.canvas.resetViewport()}
					size="s"
				>
					<wa-icon name="crosshair" />
				</wa-button>
			</div>
		);
	}
}
