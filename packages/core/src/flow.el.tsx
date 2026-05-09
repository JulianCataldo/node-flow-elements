import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { ContextProvider } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';

import { Flow } from './flow.js';
import './node.el.js';
import './canvas.el.js';
import { FLOW_SLOT, type GenericFlow } from './types.js';

// import type { GenericFlow } from './types.js';

/**
 * @slot background
 * @slot background-interactive
 * @slot foreground
 * @slot foreground-interactive
 */
export class NfFlowElement extends SignalWatcher(LitElement) {
	static styles = css`
		:host {
			display: block;
			position: relative;
			width: 100%;
			height: 100%;
		}
	`;

	static override properties = { flow: { attribute: false } };

	readonly #provider = new ContextProvider(this, { context: Flow.CONTEXT });
	#flow!: Flow;
	set flow(value) {
		this.#flow = value;
		this.#provider.setValue(value);
	}
	get flow(): GenericFlow {
		return this.#flow;
	}

	public override connectedCallback(): void {
		if (!this.flow) throw new ReferenceError('Missing flow store.');
		super.connectedCallback();
	}

	public static readonly SLOT = FLOW_SLOT;

	public override render(): HTMLTemplateResult {
		return (
			<>
				<slot name={NfFlowElement.SLOT.background} />

				<nf-interactive-canvas _:flow={this.flow}>
					<slot name={NfFlowElement.SLOT.bgInteractive} />

					<this.Nodes />

					<slot name={NfFlowElement.SLOT.fgInteractive} />
				</nf-interactive-canvas>

				<slot name={NfFlowElement.SLOT.foreground} />
			</>
		);
	}

	private readonly Nodes = (): HTMLTemplateResult[] =>
		this.#flow.nodes.list.map((node) => (
			<for:each key={node.slotName}>
				<nf-node
					class="node"
					_:node={node}
					style:map={{
						'--dx': node?.x ? `${node.x}px` : '0',
						'--dy': node?.y ? `${node.y}px` : '0',
						zIndex: node.zIndex?.toString() ?? 'initial',
					}}
				>
					<slot name={node.slotName}>
						{node.Template ? <node.Template /> : null}
					</slot>
				</nf-node>
			</for:each>
		));
}

customElements.define('nf-flow', NfFlowElement);
