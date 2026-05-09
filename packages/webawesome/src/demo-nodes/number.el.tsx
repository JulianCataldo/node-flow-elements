import { type HTMLTemplateResult } from 'lit';
import { type } from 'arktype';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import * as schemas from './schemas.js';

const numberNodeDefinition = defineNode({
	type: 'NfWaNumberNode',
	defaultDisplayName: 'Number Input',
	defaultIcon: 'plus-minus',
	helpText: null,
	ports: {
		number: definePort<number, { schema: typeof schemas.numberPortJsonSchema }>(
			{
				direction: 'out',
				customDisplayName: 'Number',
				schema: schemas.numberSchema,
				initialValue: 1,
				metadata: { schema: schemas.numberPortJsonSchema },
			},
		),
	},
});

export class NfWaNumberNode extends Node<typeof numberNodeDefinition> {
	public static override readonly definition = numberNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<jsf-webawesome
				_:schema={{
					properties: {
						number: {
							...schemas.numberPortJsonSchema,
							default: this.ports.number.value,
						},
					},
				}}
				on:jsf-change={(event) => {
					console.log('Number input changed:', event);
					const value = schemas.numberSchema(event.detail.form.data.number);
					if (value instanceof type.errors) throw value;

					this.ports.number.updateValue(value);
				}}
			/>
		</nf-wa-node>
	);
}
