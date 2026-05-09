import type { NodeSerializableOptions } from '@node-flow-elements/core/types';

export const defaultPreset = {
	initialNodes: [
		{
			id: 'Node_1',
			customDisplayName: 'Node A',
			x: 100,
			y: 100,
			ports: { output: { connectedTo: [{ node: 'Node_2', port: 'input' }] } },
		},
		{
			id: 'Node_2',
			customDisplayName: 'Node B',
			x: 400,
			y: 300,
			ports: { output: { connectedTo: [{ node: 'Node_3', port: 'input' }] } },
		},
		{
			id: 'Node_3',
			customDisplayName: 'Node B',
			x: 700,
			y: 600,
		},
	] satisfies NodeSerializableOptions[],
};
