import type { NodeFlowElements } from '../../types/vue.js';

declare module 'vue' {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface GlobalComponents extends NodeFlowElements {}
}
