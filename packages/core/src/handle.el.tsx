import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';

import { HANDLE } from './types.js';

export class NfHandleElement extends SignalWatcher(LitElement) {
	public readonly [HANDLE] = true;

	static styles = css`
		:host {
			display: contents;
			cursor: var(--cursor-move, move);
		}
	`;

	public override render(): HTMLTemplateResult {
		return <slot></slot>;
	}
}

customElements.define('nf-handle', NfHandleElement);
