import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import { css, LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher, signal } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import { Node } from '@node-flow-elements/core/node';
import {
	defineNode,
	definePort,
	type GenericPort,
} from '@node-flow-elements/core/types';

const broadcastChannelNodeDefinition = defineNode({
	type: 'NfWaBroadcastChannelNode',
	defaultDisplayName: 'Broadcast',
	defaultIcon: 'broadcast',
	helpText: null,
	ports: {
		messageInput: definePort({
			direction: 'in',
			customDisplayName: 'TX',
		}),
		messageOutput: definePort({
			direction: 'out',
			customDisplayName: 'RX',
		}),
	},
});

export class NfWaBroadcastChannelNode extends Node<
	typeof broadcastChannelNodeDefinition
> {
	public static override readonly definition = broadcastChannelNodeDefinition;

	/* @signal accessor  */
	defaultValue = signal('main');

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<wf-broadcast-channel
				_:defaultValue={this.defaultValue.get()}
				_:messageInput={this.ports.messageInput}
				_:messageOutput={this.ports.messageOutput}
			/>
		</nf-wa-node>
	);
}

@customElement('wf-broadcast-channel')
export class NfWaBroadcastChannelElement extends SignalWatcher(LitElement) {
	static styles = [
		css`
			:host {
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.channel-wrapper {
				display: flex;
				align-items: center;
			}

			header {
				display: flex;
				align-items: center;
				justify-content: space-around;
			}

			wa-copy-button {
				margin-top: 2rem;
				margin-right: var(--wa-space-m);

				&::part(button) {
					padding: 0;
				}
			}
		`,
	];

	@property({ attribute: false }) accessor messageInput!: GenericPort;
	@property({ attribute: false }) accessor messageOutput!: GenericPort;
	@property({ attribute: false }) accessor defaultValue: string = 'main';

	// @property({ attribute: false }) accessor channel = 'main';
	/* @signal accessor */ channel = signal('main');

	#broadcastChannel: BroadcastChannel = new BroadcastChannel('default');

	protected firstUpdated(): void {
		this.#reinitListener();
		reaction(
			() => [this.channel],
			() => {
				this.#reinitListener();
			},
		);

		reaction(
			() => [this.messageInput?.value],
			() => {
				// eslint-disable-next-line unicorn/require-post-message-target-origin
				this.#broadcastChannel.postMessage(this.messageInput.value);
			},
		);

		queueMicrotask(() =>
			// eslint-disable-next-line unicorn/require-post-message-target-origin
			this.#broadcastChannel.postMessage(this.messageInput.value),
		);
	}

	#listener = (event: MessageEvent<string>): void => {
		this.messageOutput.updateValue(event.data);
	};
	#reinitListener(): void {
		this.#broadcastChannel.removeEventListener('message', this.#listener);
		this.#broadcastChannel.close();
		this.#broadcastChannel = new BroadcastChannel(this.channel.get());
		this.#broadcastChannel.addEventListener('message', this.#listener);
	}

	public override render(): HTMLTemplateResult {
		return (
			<div class="channel-wrapper">
				<jsf-webawesome
					_:schema={{
						properties: {
							text: {
								title: 'Channel unique name',
								// description: "Enter some text…",
								default: this.defaultValue ?? 'main',
								type: 'string',
							},
						},
					}}
					on:jsf-change={(event) =>
						(this.channel = event.detail.form.data.text)
					}
				/>
				<wa-copy-button _:value={this.channel.get()}></wa-copy-button>
			</div>
		);
	}
}
