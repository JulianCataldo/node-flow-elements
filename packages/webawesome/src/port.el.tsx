import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import type { GenericPort } from '@node-flow-elements/core/types';

import styles from './port.css' with { type: 'css' };

@customElement('nf-wa-port')
export class NfWaPortElement extends SignalWatcher(LitElement) {
	static styles = styles;

	@property({ attribute: false }) accessor port!: GenericPort;

	public override render(): HTMLTemplateResult {
		const portType =
			this.port.customValueType ??
			`${(typeof this.port.value)
				.charAt(0)
				.toUpperCase()}${(typeof this.port.value).slice(1)}`;

		const portIcon = this.port.customValueType ? 'package' : 'check';

		return (
			<nf-port
				// FIXME: Private #name mismatch. IDK why
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				_:port={this.port as any}
				class:list={[
					'wrapper',
					this.port.isPulsing && 'is-pulsing',
					this.port.connectedTo.length > 0 && 'is-connected',
				]}
			>
				<wa-tooltip
					for="port"
					placement={this.port.direction === 'in' ? 'right' : 'left'}
				>
					<span class="port-type-tooltip-content">
						{portType}
						<wa-icon name={portIcon} />
					</span>
				</wa-tooltip>
				<div
					id="port"
					class:list={[
						'port',
						this.port.direction === 'in' ? 'inlet' : 'outlet',
						this.port.connectedTo.length > 0 && 'is-connected',
						this.port.isPulsing && 'is-pulsing',
					]}
				>
					<wa-icon name="caret-right" variant="fill" />
				</div>
			</nf-port>
		);
	}
}
