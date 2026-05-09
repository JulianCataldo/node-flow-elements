import type { HTMLTemplateResult } from 'lit';
import { Node } from '@node-flow-elements/core/node';
import { defineNode, definePort } from '@node-flow-elements/core/types';

import { textPortJsonSchema, textSchema } from './schemas.js';

const textNodeDefinition = defineNode({
	type: 'NfWaTextNode',
	defaultDisplayName: 'Text Input',
	defaultIcon: 'cursor-text',
	helpText: null,
	ports: {
		textOutput: definePort<string, { schema: typeof textPortJsonSchema }>({
			direction: 'out',
			customDisplayName: 'Text',
			schema: textSchema,
			metadata: { schema: textPortJsonSchema },
			initialValue: textPortJsonSchema.default,
		}),
	},
});

export class NfWaTextNode extends Node<typeof textNodeDefinition> {
	public static override readonly definition = textNodeDefinition;

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<div>
				<jsf-webawesome
					_:schema={{ properties: { textInput: textPortJsonSchema } }}
					on:jsf-change={(event) =>
						this.ports.textOutput.updateValue(event.detail.form.data.textInput)
					}
				/>
			</div>
		</nf-wa-node>
	);
}
