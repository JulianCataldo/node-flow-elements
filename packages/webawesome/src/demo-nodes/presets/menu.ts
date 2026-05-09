import type { MenuItem } from '@node-flow-elements/core/types';

import { NfWaBroadcastChannelNode } from '../broadcast-channel.el.js';
import { NfWaCanvasColorNode } from '../canvas-color.el.js';
import { NfWaCanvasComparerNode } from '../canvas-comparer.el.js';
import { NfWaCanvasFiltersNode } from '../canvas-filters.el.js';
import { NfWaCanvasMixerNode } from '../canvas-mixer.el.js';
import { NfWaCanvasTextNode } from '../canvas-text.el.js';
import { NfWaDisplayNumberNode } from '../display-number.el.js';
import { NfWaNoteNode } from '../note.el.js';
import { NfWaNumberNode } from '../number.el.js';
import { NfWaOperationNode } from '../operation.el.js';
import { NfWaTextNode } from '../text.el.js';
import { NfWaTemplateNode } from '../template.el.js';

export const menu = [
	{ displayName: 'Primitives', label: true },
	{
		displayName: 'Number',
		icon: '123',
		children: [
			//
			{ nodeCtor: NfWaNumberNode },
			{ nodeCtor: NfWaOperationNode },
			{ nodeCtor: NfWaDisplayNumberNode },
		],
	},
	{
		displayName: 'Text',
		icon: 'alphabet-uppercase',
		children: [
			//
			{ nodeCtor: NfWaTextNode },
			{ nodeCtor: NfWaTemplateNode },
		],
	},
	{ displayName: 'Media', label: true },
	{
		displayName: 'Canvas',
		icon: 'collection-play',
		children: [
			//
			{ nodeCtor: NfWaCanvasTextNode },
			{ nodeCtor: NfWaCanvasFiltersNode },
			{ nodeCtor: NfWaCanvasComparerNode },
			{ nodeCtor: NfWaCanvasMixerNode },
			{ nodeCtor: NfWaCanvasColorNode },
		],
	},

	{ displayName: 'Channels', label: true },

	{ nodeCtor: NfWaBroadcastChannelNode },

	{ displayName: 'Others', label: true },
	{ nodeCtor: NfWaNoteNode },
] as const satisfies MenuItem[];
