import '@node-flow-elements/webawesome';
import '@node-flow-elements/webawesome/demo-nodes';

import { Flow } from '@node-flow-elements/core';
import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, type HTMLTemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { preset as kitchenSink } from '@node-flow-elements/webawesome/demo-nodes/presets/kitchen-sink';
import waTheme from '@node-flow-elements/webawesome/theme.css' with { type: 'css' };

@customElement('demo-nf-wa')
export class DemoNfWa extends SignalWatcher(LitElement) {
	static styles = [
		waTheme,
		css`
			:host {
				display: contents;
			}
			.wrapper {
				height: 100%;
				width: 100%;
				/* HACK: */
				/* will-change: transform; */
				/* transform: translateZ(0);
        isolation: isolate; */
				overflow: hidden;
				border-radius: var(
					--wa-border-radius-x-large,
					var(--sl-border-radius-x-large)
				);
			}
		`,
	];

	flow = new Flow(kitchenSink);

	render(): HTMLTemplateResult {
		return (
			<>
				<button
					on:click={() => {
						const root = document.documentElement;
						if (root.classList.contains('wa-dark')) {
							root.classList.remove('wa-dark');
							root.classList.add('wa-light');
						} else {
							root.classList.add('wa-dark');
							root.classList.remove('wa-light');
						}
					}}
				>
					DARK/LIGHT
				</button>
				<div class="wrapper">
					<nf-flow _:flow={this.flow} class="nf-webawesome">
						<nf-background slot="background" />
						<nf-wa-center slot="background-interactive" />
						<nf-links slot="foreground-interactive" />
						<nf-wa-inventory slot="foreground" />
						<nf-wa-minimap slot="foreground" />
						<nf-wa-navigation slot="foreground" />
					</nf-flow>
				</div>
			</>
		);
	}
}
