import { LitElement, type HTMLTemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { SignalWatcher } from '@lit-labs/signals';
import { ContextConsumer } from '@lit/context';
import type WaDialog from '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import { Flow } from '@node-flow-elements/core/flow';
import type { NfFlowElement as Nfe } from '@node-flow-elements/core/flow.el';
import type { MenuItem } from '@node-flow-elements/core/types';

import styles from './inventory.css' with { type: 'css' };

@customElement('nf-wa-inventory')
export class NfWaInventoryElement extends SignalWatcher(LitElement) {
	static styles = styles;

	declare slot: (typeof Nfe)['SLOT']['foreground'];

	protected _flowConsumer = new ContextConsumer(this, {
		context: Flow.CONTEXT,
		subscribe: true,
		callback: (value) => (this.flow = value),
	});
	@property({ attribute: false })
	accessor flow!: Flow;

	@property({ attribute: true, type: Object }) accessor i18n: {
		cancel?: string;
		confirm?: string;
		clearAll?: string;
		autoLayout?: string;
		clearCanvas?: string;
		confirmMessage?: string;
		pressEnterHint?: string;
		nodes?: string;
	} = {};

	#confirmClearAllDialogRef = createRef<WaDialog>();

	MenuPanel = (tree: MenuItem[]): HTMLTemplateResult[] =>
		tree.map((node) => {
			if (node.children)
				return (
					<wa-dropdown-item>
						{node.displayName}
						<wa-icon slot="icon" name={node.icon}></wa-icon>

						<span slot="submenu"> {this.MenuPanel(node.children)} </span>
					</wa-dropdown-item>
				);
			else if (node.label) {
				return <wa-dropdown-item disabled>{node.displayName}</wa-dropdown-item>;
			} else if (node.nodeCtor) {
				const { defaultDisplayName, defaultIcon, type } =
					node.nodeCtor.definition;
				return (
					<wa-dropdown-item
						on:click={() => {
							this.flow.nodes.add({
								id: `added_node_${crypto.randomUUID()}`,
								type,
								x:
									(this.flow.gui.contextMenuPosition.x -
										this.flow.canvas.offsetX) /
									this.flow.canvas.scale,
								y:
									(this.flow.gui.contextMenuPosition.y -
										this.flow.canvas.offsetY) /
									this.flow.canvas.scale,
							});

							this.flow.gui.setIsContextMenuVisible(false);
						}}
					>
						<wa-icon slot="icon" name={defaultIcon}></wa-icon>
						{defaultDisplayName}
					</wa-dropdown-item>
				);
			}
		});

	private Dialog = (): HTMLTemplateResult => (
		<wa-dialog use:ref={this.#confirmClearAllDialogRef}>
			<div slot="label">
				<wa-icon name="trash" variant="fill"></wa-icon>
				{this.i18n.clearCanvas ?? 'Clear canvas'}
			</div>

			<p>
				{this.i18n.confirmMessage ??
					'Are you sure you want to delete all nodes from canvas?'}
			</p>

			<p>
				<em>
					{this.i18n.pressEnterHint ?? (
						<>
							Press <kbd>ENTER</kbd> to confirm.
						</>
					)}
				</em>
			</p>

			<wa-button
				autofocus
				slot="footer"
				on:click={() => {
					const dialog = this.#confirmClearAllDialogRef.value;
					if (dialog) dialog.open = false;
				}}
			>
				{this.i18n.cancel ?? 'Cancel'}
			</wa-button>
			<wa-button
				variant="brand"
				slot="footer"
				on:click={() => {
					this.flow.nodes.clear();
					const dialog = this.#confirmClearAllDialogRef.value;
					if (dialog) dialog.open = false;
				}}
			>
				{this.i18n.confirm ?? 'Confirm'}
			</wa-button>
		</wa-dialog>
	);

	public override render(): HTMLTemplateResult {
		return (
			<>
				<div
					style:map={{
						'--xx': `${this.flow.gui.contextMenuPosition.x}px`,
						'--yy': `${this.flow.gui.contextMenuPosition.y}px`,
					}}
					class:list={[
						'context-menu-wrapper',
						this.flow.gui.isContextMenuVisible && 'is-visible',
					]}
					on:contextmenu={(event) => event.preventDefault()}
				>
					<div class="actions">
						<wa-button
							class="auto-layout"
							on:click={() => this.flow.autoLayout()}
						>
							<wa-icon
								slot="start"
								name="tree-structure"
								variant="fill"
							></wa-icon>{' '}
							{this.i18n.autoLayout ?? 'Auto-layout'}
						</wa-button>
						<wa-button
							class="clear-all"
							on:click={() => {
								const dialog = this.#confirmClearAllDialogRef.value;
								if (dialog) dialog.open = true;
							}}
						>
							<wa-icon slot="start" name="trash" variant="fill"></wa-icon>{' '}
							{this.i18n.clearAll ?? 'Clear all'}
						</wa-button>
					</div>

					<wa-dropdown
						_:open={this.flow.gui.isContextMenuVisible}
						class="context-menu-dropdown"
						on:wa-after-show={(event) => {
							// HACK: For a weird reason, it focus the first item, if no previous
							// item was focused (on the page).
							const dropdown = event.currentTarget;
							const items = dropdown.querySelectorAll('wa-dropdown-item');
							for (const item of items) {
								item.removeAttribute('active');
								item.blur();
							}
						}}
						on:wa-after-hide={() => {
							this.flow.gui.setIsContextMenuVisible(false);
						}}
					>
						<wa-button slot="trigger" size="s" appearance="filled-outlined">
							<wa-icon slot="start" name="x"></wa-icon>
							{this.i18n.nodes ?? 'Nodes'}
						</wa-button>

						{this.MenuPanel(this.flow.gui.menuItems)}
					</wa-dropdown>
				</div>

				<this.Dialog />
			</>
		);
	}
}
