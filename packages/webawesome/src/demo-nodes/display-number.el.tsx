import type { HTMLTemplateResult } from 'lit';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import { numberPortJsonSchema } from './schemas.js';

const displayNumberNodeDefinition = defineNode({
	type: 'NfWaDisplayNumberNode',
	defaultDisplayName: 'Display',
	defaultIcon: 'clipboard-text',
	helpText: null,
	ports: {
		number: definePort<unknown, { schema: typeof numberPortJsonSchema }>({
			direction: 'in',
			customDisplayName: 'Number',
			metadata: { schema: numberPortJsonSchema },
		}),
	},
});

export class NfWaDisplayNumberNode extends Node<
	typeof displayNumberNodeDefinition
> {
	public static override readonly definition = displayNumberNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<wa-card style="width: 100%">
				{/* <div slot="header">Result</div> */}
				<div
					style:map={{
						textAlign: 'right',
						fontSize: '1.25em',
						userSelect: 'text',
					}}
				>
					{typeof this.ports.number?.value === 'number' ? (
						Math.round(Number(this.ports.number.value) * 100_000) / 100_000
					) : (
						<em>Empty</em>
					)}
				</div>
			</wa-card>
		</nf-wa-node>
	);
}
