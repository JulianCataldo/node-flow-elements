import type {
	NfBackgroundElement,
	NfCanvasElement,
	NfFlowElement,
	NfHandleElement,
	NfLinksElement,
	NfNodeElement,
	NfPortElement,
	LitRenderer,
	NfWaBroadcastChannelElement,
	NfWaCanvasColorElement,
	NfWaCanvasComparerElement,
	NfWaCanvasFiltersElement,
	NfWaCanvasMixerElement,
	NfWaCanvasTextElement,
	NfWaNoteElement,
	NfWaCenterElement,
	NfWaInventoryElement,
	NfWaMinimapElement,
	NfWaNavigationElement,
	NfWaNodeElement,
	NfWaPortElement,
} from './elements.d.ts';

type BaseEvents = {};

type NfBackgroundElementProps = {
	/**  */
	'prop:slot'?: NfBackgroundElement['slot'];
	/**  */
	'prop:flow'?: NfBackgroundElement['flow'];
};

type NfCanvasElementProps = {
	/**  */
	'prop:flow'?: NfCanvasElement['flow'];
};

type NfFlowElementProps = {
	/**  */
	'prop:flow'?: NfFlowElement['flow'];
};

type NfHandleElementProps = {
	/**  */
	'prop:[HANDLE]'?: NfHandleElement['[HANDLE]'];
};

type NfLinksElementProps = {
	/**  */
	'prop:slot'?: NfLinksElement['slot'];
	/**  */
	'prop:flow'?: NfLinksElement['flow'];
};

type NfNodeElementProps = {
	/**  */
	'prop:[NODE]'?: NfNodeElement['[NODE]'];
	/**  */
	'prop:node'?: NfNodeElement['node'];
};

type NfPortElementProps = {
	/**  */
	cableOffset?: NfPortElement['cableOffset'];
	'attr:cableOffset'?: NfPortElement['cableOffset'];
	/**  */
	'prop:[PORT]'?: NfPortElement['[PORT]'];
	/**  */
	'prop:port'?: NfPortElement['port'];
	/**  */
	'prop:cableOffset'?: NfPortElement['cableOffset'];
};

type LitRendererProps = {
	/**  */
	'prop:template'?: LitRenderer['template'];
};

type NfWaBroadcastChannelElementProps = {
	/**  */
	'prop:messageInput'?: NfWaBroadcastChannelElement['messageInput'];
	/**  */
	'prop:messageOutput'?: NfWaBroadcastChannelElement['messageOutput'];
	/**  */
	'prop:channel'?: NfWaBroadcastChannelElement['channel'];
};

type NfWaCanvasColorElementProps = {
	/**  */
	'prop:canvasOut'?: NfWaCanvasColorElement['canvasOut'];
	/**  */
	'prop:textIn'?: NfWaCanvasColorElement['textIn'];
	/**  */
	'prop:color'?: NfWaCanvasColorElement['color'];
};

type NfWaCanvasComparerElementProps = {
	/**  */
	'prop:canvasBeforeIn'?: NfWaCanvasComparerElement['canvasBeforeIn'];
	/**  */
	'prop:canvasAfterIn'?: NfWaCanvasComparerElement['canvasAfterIn'];
	/**  */
	'prop:blurFactor'?: NfWaCanvasComparerElement['blurFactor'];
};

type NfWaCanvasFiltersElementProps = {
	/**  */
	'prop:canvasIn'?: NfWaCanvasFiltersElement['canvasIn'];
	/**  */
	'prop:canvasOut'?: NfWaCanvasFiltersElement['canvasOut'];
	/**  */
	'prop:blurIn'?: NfWaCanvasFiltersElement['blurIn'];
	/**  */
	'prop:brightnessIn'?: NfWaCanvasFiltersElement['brightnessIn'];
};

type NfWaCanvasMixerElementProps = {
	/**  */
	'prop:canvasAIn'?: NfWaCanvasMixerElement['canvasAIn'];
	/**  */
	'prop:canvasBIn'?: NfWaCanvasMixerElement['canvasBIn'];
	/**  */
	'prop:canvasOut'?: NfWaCanvasMixerElement['canvasOut'];
};

type NfWaCanvasTextElementProps = {
	/**  */
	'prop:canvasOut'?: NfWaCanvasTextElement['canvasOut'];
	/**  */
	'prop:textIn'?: NfWaCanvasTextElement['textIn'];
};

type NfWaNoteElementProps = {
	/**  */
	'prop:textContent'?: NfWaNoteElement['textContent'];
};

type NfWaCenterElementProps = {
	/**  */
	'prop:slot'?: NfWaCenterElement['slot'];
	/**  */
	'prop:flow'?: NfWaCenterElement['flow'];
};

type NfWaInventoryElementProps = {
	/**  */
	'prop:slot'?: NfWaInventoryElement['slot'];
	/**  */
	'prop:flow'?: NfWaInventoryElement['flow'];
	/**  */
	'prop:MenuPanel'?: NfWaInventoryElement['MenuPanel'];
};

type NfWaMinimapElementProps = {
	/**  */
	width?: NfWaMinimapElement['width'];
	'attr:width'?: NfWaMinimapElement['width'];
	/**  */
	height?: NfWaMinimapElement['height'];
	'attr:height'?: NfWaMinimapElement['height'];
	/**  */
	'prop:slot'?: NfWaMinimapElement['slot'];
	/**  */
	'prop:flow'?: NfWaMinimapElement['flow'];
	/**  */
	'prop:scale'?: NfWaMinimapElement['scale'];
	/**  */
	'prop:width'?: NfWaMinimapElement['width'];
	/**  */
	'prop:height'?: NfWaMinimapElement['height'];
	/**  */
	'prop:updateCanvas'?: NfWaMinimapElement['updateCanvas'];
};

type NfWaNavigationElementProps = {
	/**  */
	'prop:slot'?: NfWaNavigationElement['slot'];
	/**  */
	'prop:flow'?: NfWaNavigationElement['flow'];
};

type NfWaNodeElementProps = {
	/**  */
	'prop:isNodeInfosEditModeActive'?: NfWaNodeElement['isNodeInfosEditModeActive'];
	/**  */
	'prop:isDeleting'?: NfWaNodeElement['isDeleting'];
	/**  */
	'prop:node'?: NfWaNodeElement['node'];
};

type NfWaPortElementProps = {
	/**  */
	'prop:port'?: NfWaPortElement['port'];
};

export type CustomElements = {
	/**
	 *
	 *
	 * ---
	 *
	 *
	 * ### **CSS Properties:**
	 *  - **--nf-background-grid-line-colors** - undefined _(default: #191919)_
	 * - **--nf-background-grid-line-width** - undefined _(default: 1)_
	 * - **--nf-background-grid-line-spacing** - undefined _(default: 64)_
	 */
	'nf-background': Partial<
		NfBackgroundElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfBackgroundElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-interactive-canvas': Partial<
		NfCanvasElementProps & BaseEvents & JSX.HTMLAttributes<NfCanvasElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 *
	 * ### **Slots:**
	 *  - **background** - undefined
	 * - **background-interactive** - undefined
	 * - **foreground** - undefined
	 * - **foreground-interactive** - undefined
	 */
	'nf-flow': Partial<
		NfFlowElementProps & BaseEvents & JSX.HTMLAttributes<NfFlowElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-handle': Partial<
		NfHandleElementProps & BaseEvents & JSX.HTMLAttributes<NfHandleElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-links': Partial<
		NfLinksElementProps & BaseEvents & JSX.HTMLAttributes<NfLinksElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-node': Partial<
		NfNodeElementProps & BaseEvents & JSX.HTMLAttributes<NfNodeElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-port': Partial<
		NfPortElementProps & BaseEvents & JSX.HTMLAttributes<NfPortElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'lit-renderer': Partial<
		LitRendererProps & BaseEvents & JSX.HTMLAttributes<LitRenderer>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'wf-broadcast-channel': Partial<
		NfWaBroadcastChannelElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaBroadcastChannelElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-canvas-color': Partial<
		NfWaCanvasColorElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaCanvasColorElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-canvas-comparer': Partial<
		NfWaCanvasComparerElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaCanvasComparerElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-canvas-filters': Partial<
		NfWaCanvasFiltersElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaCanvasFiltersElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'wf-canvas-mixer': Partial<
		NfWaCanvasMixerElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaCanvasMixerElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-canvas-text': Partial<
		NfWaCanvasTextElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaCanvasTextElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-note': Partial<
		NfWaNoteElementProps & BaseEvents & JSX.HTMLAttributes<NfWaNoteElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-center': Partial<
		NfWaCenterElementProps & BaseEvents & JSX.HTMLAttributes<NfWaCenterElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-inventory': Partial<
		NfWaInventoryElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaInventoryElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-minimap': Partial<
		NfWaMinimapElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaMinimapElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-navigation': Partial<
		NfWaNavigationElementProps &
			BaseEvents &
			JSX.HTMLAttributes<NfWaNavigationElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-node': Partial<
		NfWaNodeElementProps & BaseEvents & JSX.HTMLAttributes<NfWaNodeElement>
	>;

	/**
	 *
	 *
	 * ---
	 *
	 */
	'nf-wa-port': Partial<
		NfWaPortElementProps & BaseEvents & JSX.HTMLAttributes<NfWaPortElement>
	>;
};
