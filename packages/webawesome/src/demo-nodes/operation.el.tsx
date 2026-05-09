import { signal } from '@lit-labs/signals';
import { reaction } from 'signal-utils/subtle/reaction';
import type { HTMLTemplateResult } from 'lit';
import { Node } from '@node-flow-elements/core/node';
import type {
	NodeConstructorParameters,
	NodeSerializableOptions,
} from '@node-flow-elements/core/types';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import * as schemas from './schemas.js';

type Operation = (typeof NfWaOperationNode)['operations'][number];

const operationNodeDefinition = defineNode({
	type: 'NfWaOperationNode',
	defaultDisplayName: 'Operation',
	defaultIcon: 'calculator',
	helpText: null,
	ports: {
		numberA: definePort<
			number,
			{ schema: typeof schemas.numberPortJsonSchema }
		>({
			direction: 'in',
			customDisplayName: 'Operand A',
			schema: schemas.numberSchema,
			metadata: { schema: schemas.numberPortJsonSchema },
		}),
		numberB: definePort<
			number,
			{ schema: typeof schemas.numberPortJsonSchema }
		>({
			direction: 'in',
			customDisplayName: 'Operand B',
			schema: schemas.numberSchema,
			metadata: { schema: schemas.numberPortJsonSchema },
		}),
		result: definePort<number>({
			direction: 'out',
			customDisplayName: 'Result',
			schema: schemas.numberSchema,
			initialValue: 0,
		}),
	},
});

export class NfWaOperationNode extends Node<typeof operationNodeDefinition> {
	public static override readonly definition = operationNodeDefinition;

	public static readonly operations = [
		'Sum',
		'Divide',
		'Minus',
		'Multiply',
	] as const;

	public $currentOperation = signal<Operation>('Sum');
	public changeOperation(operation: Operation): void {
		this.$currentOperation.set(operation);
	}

	constructor(options: NodeConstructorParameters) {
		super(options);

		reaction(
			() => [
				this.ports.numberA.value,
				this.ports.numberB.value,
				this.$currentOperation.get(),
			],
			() => this.updateResult(),
		);
	}

	public updateResult(): void {
		let result = Number.NaN;

		const b = this.ports.numberB.value || 0;
		const a = this.ports.numberA.value || 0;

		switch (this.$currentOperation.get()) {
			case 'Minus': {
				result = a - b;
				break;
			}
			case 'Divide': {
				result = a / b;
				break;
			}
			case 'Multiply': {
				result = a * b;
				break;
			}
			default: {
				result = a + b;
				break;
			}
		}
		this.ports.result.updateValue(result);
	}

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<div style="display:flex; justify-content: center">
				<jsf-webawesome
					_:schema={{
						properties: {
							operation: {
								title: 'Calculation type',
								type: 'string',
								enum: NfWaOperationNode.operations,
							},
						},
					}}
					_:data={{
						operation: this.$currentOperation.get(),
					}}
					_:ui={{ operation: { 'ui:widget': 'Button' } }}
					on:jsf-change={(event) =>
						this.changeOperation(event.detail.form.data.operation)
					}
				/>
			</div>
		</nf-wa-node>
	);

	public override fromJSON(
		options: NodeSerializableOptions<Node, { initialOperation: Operation }>,
	): void {
		super.fromJSON(options);

		const operation = options.initialOperation;

		queueMicrotask(() => this.changeOperation(operation));
	}

	// TODO:
	// public override toJSON(): SerializableOptions<Pick<this, 'foo'>> {
	//   const { foo } = this;
	//   return { ...super.toJSON(), foo };
	// }
}
