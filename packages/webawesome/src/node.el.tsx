/* eslint-disable max-lines */
import '@node-flow-elements/core/port.el';
import '@node-flow-elements/core/handle.el';

import { createRef } from 'lit/directives/ref.js';
import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type WaCard from '@awesome.me/webawesome/dist/components/card/card.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { SignalWatcher } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import type { Port } from '@node-flow-elements/core/port';
import type { GenericNode } from '@node-flow-elements/core/types';

import styles from './node.css' with { type: 'css' };
import type { PortsWithSchema } from './demo-nodes/schemas.js';

@customElement('nf-wa-node')
export class NfWaNodeElement extends SignalWatcher(LitElement) {
	static styles = styles;

	@state() accessor isNodeInfosEditModeActive = false;
	@state() accessor isDeleting = false;
	@property({ attribute: false }) accessor node!: GenericNode;
	@property({ attribute: true, type: Object }) accessor i18n: {
		settings?: string;
		delete?: string;
		ok?: string;
	} = {};

	#renameInputRef = createRef<WaInput>();
	#draggableRef = createRef<WaCard>();

	public override firstUpdated(): void {
		reaction(
			() => this.node.isSelected,
			() => {
				if (!this.node.isSelected && this.isNodeInfosEditModeActive)
					this.isNodeInfosEditModeActive = false;
			},
		);
	}

	public override render(): HTMLTemplateResult {
		if (!this.node) throw new ReferenceError('Missing node.');
		return (
			<wa-card
				use:ref={this.#draggableRef}
				class:map={{
					wrapper: true,
					'is-hovering': this.node.isHovering,
					'is-dragging': this.node.isDragging,
					'is-selected': this.node.isSelected,
					'is-deleting': this.isDeleting,
					'is-connecting-port': this.node.flow.links.connecting !== null,
				}}
			>
				<this.Header></this.Header>

				<slot />

				{Object.values(this.node.ports).length > 0 ? <this.Footer /> : null}
			</wa-card>
		);
	}

	private Coordinates = (): HTMLTemplateResult => (
		<div
			class:map={{
				coords: true,
				'is-visible': this.node.flow.gui.isCoordinatesVisible,
			}}
		>
			<wa-tag size="s" class="tag-x">
				X: {Math.round(this.node.x)}
			</wa-tag>
			<wa-tag size="s" class="tag-y">
				Y: {Math.round(this.node.y)}
			</wa-tag>
		</div>
	);

	private Title = (): HTMLTemplateResult => (
		<div class="title">
			<wa-icon class="title-icon" name={this.node.defaultIcon} />
			<wa-tooltip
				_:anchor={this.renderRoot?.querySelector('.title-icon') ?? null}
			>
				<strong>{this.node.defaultDisplayName}</strong>

				{this.node.helpText ? (
					<>
						<wa-divider style="margin: var(--wa-space-xs) 0" />
						<div>{this.node.helpText}</div>
					</>
				) : null}
			</wa-tooltip>

			{this.node?.displayName}
		</div>
	);

	private Settings = (): HTMLTemplateResult => (
		<wa-dropdown
			_:open={this.isNodeInfosEditModeActive}
			placement="top-end"
			on:wa-hide={() => {
				this.isNodeInfosEditModeActive = false;
			}}
			on:wa-show={() => {
				this.isNodeInfosEditModeActive = true;

				if (this.isNodeInfosEditModeActive)
					setTimeout(() => {
						this.#renameInputRef.value!.focus();
					}, 50);
			}}
		>
			<wa-button
				slot="trigger"
				aria-label={this.i18n.settings ?? 'Settings'}
				size="s"
				appearance="filled-outlined"
				style:map={{
					opacity: this.node.isSelected || this.node.isHovering ? 1 : 0.15,

					color: this.isNodeInfosEditModeActive
						? 'var(--wa-color-brand)'
						: 'var(--wa-color-text-quiet)',
				}}
				on:click={(event) => {
					event.stopPropagation();
					if (!this.node.isSelected) this.node.flow.nodes.select(this.node);
					this.isNodeInfosEditModeActive = !this.isNodeInfosEditModeActive;
				}}
			>
				<wa-icon name="pencil-simple" />
			</wa-button>

			<div class="node-settings">
				<wa-button
					on:click={() => {
						this.isNodeInfosEditModeActive = false;

						// FIXME: cables
						this.isDeleting = true;
						setTimeout(() => {
							this.isDeleting = false;
						}, 270);

						if (this.node.flow.nodes.hasSelected && this.node.isSelected)
							this.node.flow.nodes.deleteSelected();
						else this.node.delete();
					}}
					size="s"
					appearance="plain"
					variant="danger"
				>
					{this.i18n.delete ?? 'Delete'}
				</wa-button>

				<wa-divider orientation="vertical" />

				<wa-input
					use:ref={this.#renameInputRef}
					size="s"
					type="text"
					name="display_name"
					_:value={this.node?.displayName ?? ''}
					on:keydown={(event) => {
						// HACK:
						if (event.key === 'Enter') {
							event.currentTarget
								.closest('form')
								?.dispatchEvent(new Event('submit'));
						}
					}}
				/>

				<wa-button appearance="accent" type="submit" size="s">
					{this.i18n.ok ?? 'Save'}
				</wa-button>
			</div>
		</wa-dropdown>
	);

	private Header = (): HTMLTemplateResult => (
		<div class="header" slot="header">
			<this.Coordinates />
			<nf-handle slot="header">
				<this.Title />
			</nf-handle>

			<form
				on:submit={(event) => {
					event.preventDefault();
					this.#renameInputRef.value?.blur();

					const formData = new FormData(event.target as HTMLFormElement);

					const displayName = formData.get('display_name')?.toString();
					if (displayName === '')
						this.node?.updateDisplayName(this.node.defaultDisplayName);
					else if (displayName && displayName !== this.node.defaultDisplayName)
						this.node?.updateDisplayName(displayName);

					this.isNodeInfosEditModeActive = false;
				}}
				style:map={{ display: 'contents' }}
			>
				<this.Settings />
			</form>
		</div>
	);

	private Footer = (): HTMLTemplateResult | null => {
		const visibleInputs = Object.values(this.node.ports).filter(
			(port) => port.direction === 'in' && !port.metadata.hidden,
		);
		const visibleOutputs = Object.values(this.node.ports).filter(
			(port) => port.direction === 'out' && !port.metadata.hidden,
		);

		if (visibleInputs.length === 0 && visibleOutputs.length === 0) return null;

		return (
			<div slot="footer">
				{visibleInputs.length > 0 ? (
					<this.Ports ports={visibleInputs} type="input" />
				) : null}

				{visibleOutputs.length > 0 ? (
					<this.Ports ports={visibleOutputs} type="output" />
				) : null}
			</div>
		);
	};

	private readonly Label = ({
		port,
		type,
	}: {
		port: Port<unknown, PortsWithSchema>;
		type: 'output' | 'input';
	}): HTMLTemplateResult => (
		<wa-button-group class="action">
			{type === 'output' ? <this.Deleter port={port} /> : null}
			{type === 'input' ? <this.Banger port={port} /> : null}

			<wa-dropdown
				_:placement={type === 'input' ? 'left-end' : 'right-end'}
				_:open={this.node.flow.links.selectedPort === port}
				class="port-editor"
				on:wa-show={() => {
					this.node.flow.links.selectPort(port);
				}}
				on:wa-hide={() => {
					if (this.node.flow.links.selectedPort === port)
						this.node.flow.links.selectPort(null);
				}}
			>
				<wa-button
					appearance="filled-outlined"
					size="s"
					slot="trigger"
					_:disabled={port.metadata.schema === null}
				>
					<div>{port.displayName}</div>
				</wa-button>

				<div>
					{/* TODO: Put in slot: */}
					{typeof port.metadata.schema === 'object' ? (
						<jsf-webawesome
							_:schema={{
								properties: {
									portValue: {
										title: port.customDisplayName ?? `Port ${type} value`,
										...port.metadata.schema,
									},
								},
							}}
							_:data={{
								portValue: port.value ?? port.metadata.schema?.default,
							}}
							on:jsf-change={(event) =>
								port.updateValue(event.detail.form.data.portValue)
							}
						/>
					) : null}
				</div>
			</wa-dropdown>

			{type === 'output' ? <this.Banger port={port} /> : null}
			{type === 'input' ? <this.Deleter port={port} /> : null}
		</wa-button-group>
	);

	private readonly Banger = ({ port }: { port: Port }): HTMLTemplateResult => (
		<wa-button
			class="pulse"
			name="activity"
			size="s"
			appearance="filled-outlined"
			on:click={() => port.bang()}
		>
			<wa-icon name="pulse" />
		</wa-button>
	);

	private readonly Deleter = ({ port }: { port: Port }): HTMLTemplateResult => (
		<wa-button
			class="disconnect-all"
			name="activity"
			size="s"
			appearance="filled-outlined"
			on:click={() => port.disconnectAll()}
		>
			<wa-icon name="x" />
		</wa-button>
	);

	private readonly Ports = ({
		ports,
		type,
	}: {
		ports: Port<unknown, PortsWithSchema>[];
		type: 'input' | 'output';
	}): HTMLTemplateResult => (
		<div class:list={['port-wrapper', type]}>
			{/* <For each={ports} key={(port) => port.id}> */}
			{ports.map((port) =>
				port.metadata.hidden ? null : (
					<div class="handle">
						{type === 'output' ? <this.Label port={port} type={type} /> : null}

						<div
							class:list={[
								'port',
								ports.at(0)?.direction === 'in' ? 'inlet' : 'outlet',
							]}
						>
							<nf-wa-port _:port={port} />
						</div>

						{type === 'input' ? <this.Label port={port} type={type} /> : null}
					</div>
				),
			)}
			{/* </For> */}
		</div>
	);
}
