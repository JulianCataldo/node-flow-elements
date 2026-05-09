/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/consistent-function-scoping */
import { computed, signal } from '@lit-labs/signals';

import type {
	Coordinates,
	NodeClass,
	NodeConstructorParameters,
	NodeDefinition,
	NodePortDefinitions,
	NodeSerializableOptions,
	PortDefinition,
	PortInstancesFromDefinitions,
} from './types.js';
import { defineNode, definePort } from './types.js';
import { Port } from './port.js';

const baseNodeDefinition = defineNode({
	type: 'Node',
	defaultDisplayName: 'Node',
	defaultIcon: 'activity',
	helpText: null,
	ports: {
		input: definePort({ direction: 'in' }),
		output: definePort({ direction: 'out' }),
	},
});

export class Node<Definition extends NodeDefinition = NodeDefinition> {
	public static readonly definition: NodeDefinition = baseNodeDefinition;

	public readonly flow;
	public readonly superType = 'Node';

	public readonly type: Definition['type'];
	public id: string;

	public readonly defaultDisplayName: Definition['defaultDisplayName'];
	public readonly defaultIcon: Definition['defaultIcon'];
	public readonly helpText: Definition['helpText'];

	public get definition(): Definition {
		return (this.constructor as NodeClass<Definition>).definition as Definition;
	}

	public readonly Template: (() => unknown) | null = null;

	public readonly $ports = signal<Record<string, Port>>({});
	public get ports(): PortInstancesFromDefinitions<Definition['ports']> {
		return this.$ports.get() as PortInstancesFromDefinitions<
			Definition['ports']
		>;
	}

	constructor(options: NodeConstructorParameters<Node<Definition>>) {
		this.flow = options.flow;

		const definition = this.definition;

		this.type = definition.type;
		this.defaultDisplayName = definition.defaultDisplayName;
		this.defaultIcon = definition.defaultIcon;
		this.helpText = definition.helpText;

		this.id = options.data?.id || `node_${crypto.randomUUID()}`;

		this.$ports.set(this.materializePorts(definition.ports));

		if (options.data) this.fromJSON(options.data);
	}

	protected materializePorts<Ports extends NodePortDefinitions>(
		definitions: Ports,
	): PortInstancesFromDefinitions<Ports> {
		return Object.fromEntries(
			Object.entries(definitions).map(([name, definition]) => [
				name,
				this.createPortFromDefinition(name, definition),
			]),
		) as PortInstancesFromDefinitions<Ports>;
	}

	protected createPortFromDefinition<Type = any, const PortMeta = unknown>(
		name: string,
		definition: PortDefinition<Type, PortMeta>,
	): Port<Type, PortMeta> {
		return new Port<Type, PortMeta>(name, definition, this);
	}

	public get slotName(): string {
		return `node_${this.id}`;
	}

	public readonly $customDisplayName = signal<string | null>(null);
	public get customDisplayName(): string | null {
		return this.$customDisplayName.get();
	}
	public updateDisplayName(customName: string): void {
		this.$customDisplayName.set(customName);
		this.flow.dispatch(this.updateDisplayName.name, arguments, this);
	}
	public get displayName(): string {
		return this.customDisplayName ?? this.defaultDisplayName;
	}

	public readonly $isSelected = computed(() =>
		this.flow.nodes.selected.includes(this),
	);
	public get isSelected(): boolean {
		return this.$isSelected.get();
	}

	public readonly $zIndex = signal<number | null>(null);
	public get zIndex(): number | null {
		return this.$zIndex.get();
	}
	public updateZIndex(value: number): void {
		this.$zIndex.set(value);
		this.flow.dispatch(this.updateZIndex.name, arguments, this);
	}

	public readonly $isDragging = signal(false);
	public get isDragging(): boolean {
		return this.$isDragging.get();
	}
	public setIsDragging(state: boolean): void {
		this.$isDragging.set(state);
		this.flow.dispatch(this.setIsDragging.name, arguments, this);
	}

	public readonly $isHovering = signal(false);
	public get isHovering(): boolean {
		return this.$isHovering.get();
	}
	public setIsHovering(state: boolean): void {
		this.$isHovering.set(state);
		this.flow.dispatch(this.setIsHovering.name, arguments, this);
	}

	public readonly $x = signal(0);
	public get x(): number {
		return this.$x.get();
	}
	public readonly $y = signal(0);
	public get y(): number {
		return this.$y.get();
	}

	public readonly $width = signal(0);
	public get width(): number {
		return this.$width.get();
	}
	public readonly $height = signal(0);
	public get height(): number {
		return this.$height.get();
	}

	// realX = 0;
	// realY = 0;

	public updatePosition(options: Coordinates): void {
		// const gridSize = 16;

		// TODO:
		// const roundNearest = (coord, gridSize) => {
		//   return Math.round(coord / gridSize) * gridSize;
		// };
		// const roundNearest = (xx, nearest) => {
		//   return xx % gridSize ? xx - (xx % gridSize) + gridSize : xx;
		// };
		// if (this.realX % gridSize === 0) this.x = x;
		// if (this.realY % gridSize === 0) this.y = y;

		// this.realX = x;
		// this.realY = y;

		// this.x = roundNearest(x, gridSize);
		// this.y = roundNearest(y, gridSize);

		if (options.x !== undefined) this.$x.set(options.x);
		if (options.y !== undefined) this.$y.set(options.y);

		this.flow.dispatch(this.updatePosition.name, arguments, this);
	}

	public updateSizeFromDom({ width, height }: DOMRect): void {
		this.$width.set(width / this.flow.canvas.scale);
		this.$height.set(height / this.flow.canvas.scale);
	}

	public delete(): void {
		for (const port of Object.values(this.ports) as Port[])
			port.disconnectAll();

		this.flow.nodes.deselect(this);

		this.flow.nodes.$list.set(
			this.flow.nodes.list.filter((node) => node !== this),
		);
		this.flow.dispatch(this.delete.name, arguments, this);
	}

	protected publishPort<Type = any, const PortMeta = unknown>(
		name: string,
		definition: PortDefinition<Type, PortMeta>,
	): Port<Type, PortMeta> {
		const port = this.createPortFromDefinition<Type, PortMeta>(
			name,
			definition,
		);
		this.$ports.set({ ...this.$ports.get(), [name]: port });
		return port;
	}

	protected retractPort(name: string): void {
		const port = this.$ports.get()[name];
		if (!port) return;
		port.disconnectAll();
		const updated = { ...this.$ports.get() };
		delete updated[name];
		this.$ports.set(updated);
	}

	public fromJSON(options: NodeSerializableOptions<Node<Definition>>): void {
		this.id = options.id;
		this.$x.set(options.x);
		this.$y.set(options.y);
		if (options.zIndex !== undefined) this.$zIndex.set(options.zIndex);
		if (options.customDisplayName !== undefined)
			this.$customDisplayName.set(options.customDisplayName);
	}

	public toJSON(): NodeSerializableOptions<Node<Definition>> {
		const { type, id: id, x, y, displayName, zIndex, ports: _ports } = this;

		const ports = Object.fromEntries(
			Object.entries(_ports).map(([name, port]) => [name, port.toJSON()]),
		) as NodeSerializableOptions<Node<Definition>>['ports'];

		return { type, id: id, x, y, displayName, zIndex, ports };
	}
}
