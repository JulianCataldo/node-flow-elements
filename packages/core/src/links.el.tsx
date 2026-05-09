import {
	LitElement,
	type HTMLTemplateResult,
	type SVGTemplateResult,
} from 'lit';
import { animate } from '@lit-labs/motion';
import { ContextConsumer } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';

import { Flow } from './flow.js';
import type { ConnectingLink, GenericFlow, Link } from './types.js';
import styles from './links.css' with { type: 'css' };
import type { NfFlowElement as Nfe } from './flow.el.js';

// IDEA: Parametrize styles via CSS?
export class NfLinksElement extends SignalWatcher(LitElement) {
	static styles = styles;

	declare slot: (typeof Nfe)['SLOT']['fgInteractive'];

	declare flow?: GenericFlow;
	static properties = { flow: { attribute: false } };

	readonly #flowProvider = new ContextConsumer(this, {
		context: Flow.CONTEXT,
		subscribe: true,
	});
	get #flow(): GenericFlow {
		const flow = this.flow || this.#flowProvider.value;
		if (!flow) throw new ReferenceError('Missing flow.');
		return flow;
	}

	private readonly Cable = ({
		link,
		type,
	}: {
		link: Link | ConnectingLink;
		type?: 'overlay' | 'fatty' | 'outline';
	}): SVGTemplateResult => {
		const dPath = this.#flow.links.makeSvgPath(link);

		const cableStyles = {
			// NOTE: DISABLED (performance issues).
			// IDEA: Might use CSS, not inline styles.
			// animation: 'dash 120s linear infinite',
			// transition: 'stroke 25ms, stroke-width 25ms ',
		};

		// TODO: Parametrize CSS vars.
		const strokeWidth = (
			{
				fatty: '10px',
				outline: '6px',
				overlay: '3px',
				none: link.from.isPulsing ? '3px' : '1px',
			} as const
		)[type ?? 'none'];

		const stroke = (
			{
				fatty: 'transparent',
				outline: 'var(--_nf-links-grid-stroke-main-outline-color)',
				overlay: 'var(--_nf-links-grid-stroke-main-overlay-color)',
				main: link.from.isPulsing
					? 'var(--_nf-links-grid-stroke-main-pulsing-color)'
					: 'var(--_nf-links-grid-stroke-main-color)',
			} as const
		)[type ?? 'main'];

		// TODO: Parametrize CSS vars.
		const dashArray = type === 'overlay' ? '20 100' : undefined;
		const dashOffset = type === 'overlay' ? 955 : undefined;

		return (
			<use:svg>
				<path
					fill="transparent"
					class={type ?? ''}
					style:map={cableStyles}
					d={dPath}
					stroke-dasharray={dashArray}
					stroke-dashoffset={dashOffset}
					stroke-width={strokeWidth}
					stroke={stroke}
				/>
			</use:svg>
		);
	};

	public override render(): HTMLTemplateResult {
		return (
			<div
				on:dblclick={(event: MouseEvent) => event.stopPropagation()}
				class="links"
				style:map={{
					width: `${this.#flow.canvas.viewportRect.width}px`,
					height: `${this.#flow.canvas.viewportRect.height}px`,

					left: `${this.#flow.canvas.viewportRect.x}px`,
					top: `${this.#flow.canvas.viewportRect.y}px`,

					zIndex: this.#flow.nodes.isDraggingAny
						? this.#flow.nodes.list.length + 1
						: 0,
				}}
			>
				<svg>
					{this.#flow.links.connecting ? (
						<use:svg>
							<this.Cable link={this.#flow.links.connecting} />
							<this.Cable link={this.#flow.links.connecting} type="overlay" />
						</use:svg>
					) : null}

					{this.#flow.links.list.map((link) => (
						<for:each key={`${link.from.id}_${link.to.id}`}>
							<use:svg>
								<g
									use:directive={animate({
										skipInitial: true,
										stabilizeOut: true,
										in: [],
										out: [{ opacity: 0 }],
										properties: ['opacity'],
										keyframeOptions: { duration: 150 },
										id: `${link.from.id}_${link.to.id}`,
										inId: `in_${link.from.id}_${link.to.id}`,
									})}
									class:map={{
										paths: true,
										'is-connecting-port': this.#flow.links.connecting !== null,
									}}
									on:dblclick={() => link.from.disconnect(link.to)}
									on:mousedown={(event) => event.stopPropagation()}
								>
									<this.Cable link={link} type="outline" />
									<this.Cable link={link} />
									<this.Cable link={link} type="overlay" />
									<this.Cable link={link} type="fatty" />
								</g>
							</use:svg>
						</for:each>
					))}
				</svg>
			</div>
		);
	}
}

customElements.define('nf-links', NfLinksElement);
