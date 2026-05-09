/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable unicorn/no-this-assignment */

import { computed, signal } from '@lit-labs/signals';
import type { StandardSchemaV1 } from '@standard-schema/spec';

import { Node } from './node.js';
import type { Flow } from './flow.js';
import type { AddPortOptions, PortDirection, Validate } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Port<Value = any, PortMetadata = any> {
	public readonly flow: Flow;

	public readonly node: Node;
	public readonly superType = 'Port';

	readonly #name: string;

	public get name(): string {
		return this.#name;
	}
	public get id(): string {
		return `port_${this.name}__${this.node.id}`;
	}

	public readonly $direction = signal<PortDirection>('both');
	public get direction(): PortDirection {
		return this.$direction.get();
	}

	public readonly validate: Validate<Value> | null = null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public readonly schema: StandardSchemaV1<any, Value> | null = null;

	public readonly $metadata = signal<PortMetadata>({} as PortMetadata);
	public get metadata(): PortMetadata {
		return this.$metadata.get();
	}

	constructor(
		name: string,
		options: AddPortOptions<Value, PortMetadata>,
		node: Node,
	) {
		this.#name = name;
		this.node = node;
		this.flow = node.flow;

		this.fromJSON(options);

		if (options.validate) this.validate = options.validate;
		if (options.schema) this.schema = options.schema;
	}

	public readonly $connectedTo = signal<Port[]>([]);
	public get connectedTo(): Port[] {
		return this.$connectedTo.get();
	}

	declare public readonly customValueType?: string;

	public readonly $value = signal<Value | null>(null);
	public get value(): Value | null {
		return this.$value.get();
	}
	public updateValue(value: this['value']): void {
		this.$value.set(value);

		for (const port of this.connectedTo)
			if (port.direction === 'in') port.updateValue(value);

		this.bang();
		this.flow.dispatch(this.updateValue.name, arguments, this);
	}

	public setValidity(state: boolean): void {
		this.$validity.set(state);
		setTimeout(() => this.setValidity(state));
	}

	public connectTo(port: Port): void {
		if (port === this) return;
		if (port.node === this.node) return;

		// Determine direction: this must output, port must input.
		const fromCanOut = this.direction === 'out' || this.direction === 'both';
		const fromCanIn = this.direction === 'in' || this.direction === 'both';
		const toCanOut = port.direction === 'out' || port.direction === 'both';
		const toCanIn = port.direction === 'in' || port.direction === 'both';

		let from: Port;
		let to: Port;
		if (fromCanOut && toCanIn && this.direction !== port.direction) {
			from = this;
			to = port;
		} else if (toCanOut && fromCanIn && this.direction !== port.direction) {
			from = port;
			to = this;
		} else {
			return;
		}

		// Idempotent: already connected?
		if (from.connectedTo.includes(to)) return;

		// Validation against the input side.
		if (to.schema) {
			const result = to.schema['~standard'].validate(from.value);
			if (result instanceof Promise) {
				void result.then((resolved) => {
					if (resolved.issues) to.setValidity(false);
				});
			} else if (result.issues) {
				to.setValidity(false);
				return;
			}
		} else if (to.validate && !to.validate(from.value)) {
			to.setValidity(false);
			return;
		}

		from.$connectedTo.set([...from.connectedTo, to]);
		to.$connectedTo.set([...to.connectedTo, from]);

		if (to.direction === 'in') to.updateValue(from.value);

		this.flow.canvas.updateMousePosition({ x: null, y: null });
		this.flow.dispatch(this.connectTo.name, arguments, this);
	}

	public disconnect(port: Port): void {
		if (!this.connectedTo.includes(port)) return;

		this.$connectedTo.set(this.connectedTo.filter((p) => p !== port));
		port.$connectedTo.set(port.connectedTo.filter((p) => p !== this));
		this.setIsDisconnecting(false);
		this.flow.dispatch(this.disconnect.name, arguments, this);
	}

	public disconnectAll(): void {
		for (const other of this.connectedTo) this.disconnect(other);
	}

	public readonly $isDisconnecting = signal(false);
	public get isDisconnecting(): boolean {
		return this.$isDisconnecting.get();
	}
	public setIsDisconnecting(value: boolean): void {
		this.$isDisconnecting.set(value);
	}

	public readonly $customDisplayName = signal<string | null>(null);
	public get customDisplayName(): string | null {
		return this.$customDisplayName.get();
	}

	public get displayName(): string {
		return this.customDisplayName ?? this.name;
	}

	public updateDisplayName(customName: string): void {
		this.$customDisplayName.set(customName);
		this.flow.dispatch(this.updateDisplayName.name, arguments, this);
	}

	public readonly $validity = signal(true);
	public get validity(): boolean {
		return this.$validity.get();
	}

	/** Whether this port is currently selected (e.g. its editor popup is open). */
	public readonly $isSelected = computed<boolean>(
		// eslint-disable-next-line unicorn/consistent-function-scoping
		() => this.flow.links.selectedPort === this,
	);
	public get isSelected(): boolean {
		return this.$isSelected.get();
	}

	public setIsPulsing(state: boolean): void {
		this.$isPulsing.set(state);
	}

	public readonly $lastChangeTime = signal(0);
	public get lastChangeTime(): number {
		return this.$lastChangeTime.get();
	}

	public bang(): void {
		this.setIsPulsing(true);
		setTimeout(() => this.setIsPulsing(false), 50);
		this.$lastChangeTime.set(Date.now());
		this.flow.dispatch(this.bang.name, arguments, this);
	}

	public readonly $isPulsing = signal(false);
	public get isPulsing(): boolean {
		return this.$isPulsing.get();
	}

	public readonly $x = signal(0);
	public get x(): number {
		return this.$x.get();
	}
	public readonly $y = signal(0);
	public get y(): number {
		return this.$y.get();
	}

	public updatePositionFromDom({
		rect,
		scroll,
		cableOffset = 4,
	}: {
		rect: DOMRect;
		scroll: { x: number; y: number };
		cableOffset?: number;
	}): void {
		const { scale, offsetX, offsetY, viewportRect } = this.flow.canvas;

		// NOTE: So the cable is sticking out
		const adjustment = cableOffset * (this.direction === 'in' ? -1 : 1);

		this.$x.set(
			(rect.x +
				scroll.x -
				offsetX -
				viewportRect.x +
				rect.width / 2 +
				adjustment) /
				scale,
		);
		this.$y.set(
			(rect.y +
				//
				scroll.y -
				offsetY -
				viewportRect.y +
				rect.height / 2) /
				scale,
		);
	}

	public fromJSON(options: AddPortOptions<Value, PortMetadata>): void {
		if (options.initialValue != null) this.$value.set(options.initialValue);
		if (options.direction) this.$direction.set(options.direction);
		if (options.metadata) this.$metadata.set(options.metadata);
		if (options.customDisplayName)
			this.$customDisplayName.set(options.customDisplayName);
	}

	public toJSON(): {
		x: number;
		y: number;
		value: Value | null;
		connectedTo: { node: string; port: string }[];
	} {
		const { x, y, value, connectedTo: _connectedTo } = this;

		const connectedTo = _connectedTo.map((connectedPort) => ({
			node: connectedPort.node.id,
			port: connectedPort.name,
		}));

		return { x, y, value, connectedTo };
	}
}
