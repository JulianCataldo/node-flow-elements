import './port.el.js';

import { SignalWatcher } from '@lit-labs/signals';
import { css, LitElement, type HTMLTemplateResult } from 'lit';

import { Node } from './node.js';
import { NODE } from './types.js';

export class NfNodeElement extends SignalWatcher(LitElement) {
	public readonly [NODE] = true;

	static override properties = { node: { attribute: false } };
	declare public node: Node;

	static styles = css`
		:host {
			display: block;
		}
	`;

	public override firstUpdated(): void {
		if (!this.node) throw new ReferenceError('Missing node.');

		const observer = new ResizeObserver(() => this.#onResize());
		observer.observe(this);
	}

	#onResize(): void {
		const rect = this.getBoundingClientRect();
		this.node.updateSizeFromDom(rect);
	}

	public override render(): HTMLTemplateResult {
		return <slot />;
	}
}

customElements.define('nf-node', NfNodeElement);
