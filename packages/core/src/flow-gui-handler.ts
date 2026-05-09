/* eslint-disable prefer-rest-params */
import { signal } from '@lit-labs/signals';

import type { MenuItem } from './types.js';

type DispatchFunction = (
	method: string,
	arguments_: IArguments | undefined,
) => void;

type FlowGuiContext = {
	dispatch: DispatchFunction;
};

export class FlowGuiHandler {
	readonly #dispatch: DispatchFunction;

	constructor(context: FlowGuiContext) {
		this.#dispatch = context.dispatch;
	}

	// MARK: Context menu

	public readonly $isContextMenuVisible = signal(false);
	public get isContextMenuVisible(): boolean {
		return this.$isContextMenuVisible.get();
	}
	public setIsContextMenuVisible(state: boolean): void {
		this.$isContextMenuVisible.set(state);
		this.#dispatch('setIsContextMenuVisible', arguments);
	}

	public readonly $contextMenuPosition = signal({ x: 0, y: 0 });
	public get contextMenuPosition(): { x: number; y: number } {
		return this.$contextMenuPosition.get();
	}
	public setContextMenuPosition(state: { x: number; y: number }): void {
		this.$contextMenuPosition.set(state);
	}

	// MARK: Menu items

	public readonly $menuItems = signal<MenuItem[]>([]);
	public get menuItems(): MenuItem[] {
		return this.$menuItems.get();
	}
	public registerMenu(items: MenuItem[]): void {
		this.$menuItems.set(items);
	}

	// MARK: Coordinates overlay

	public readonly $isCoordinatesVisible = signal(false);
	public get isCoordinatesVisible(): boolean {
		return this.$isCoordinatesVisible.get();
	}
	public setIsCoordinatesVisible(state: boolean): void {
		this.$isCoordinatesVisible.set(state);
		this.#dispatch('setIsCoordinatesVisible', arguments);
	}
}
