import type { Coordinates } from '../types.js';

interface NodeRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ViewportBounds {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface FindFreePositionOptions {
	/** Target position in canvas coordinates. */
	x: number;
	/** Target position in canvas coordinates. */
	y: number;
	/** Estimated width of the node to place. */
	estimatedWidth?: number;
	/** Estimated height of the node to place. */
	estimatedHeight?: number;
	/** Existing node rectangles (canvas coordinates). */
	nodes: NodeRect[];
	/** Visible viewport in canvas coordinates (optional). */
	viewport?: ViewportBounds;
}

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 80;
const FULL_PADDING = 24;
const MAX_RINGS = 20;
/** Margin from viewport edges (canvas px) before a position is considered "out". */
const VIEWPORT_INSET = 32;
/** On the relaxed pass, allow up to this fraction of overlap (0–1). */
const RELAXED_OVERLAP_RATIO = 0.5;

function estimateSize(
	nodes: NodeRect[],
	fallbackW: number,
	fallbackH: number,
): { w: number; h: number } {
	if (nodes.length === 0) return { w: fallbackW, h: fallbackH };
	const w =
		nodes.reduce((s, n) => s + (n.width || fallbackW), 0) / nodes.length;
	const h =
		nodes.reduce((s, n) => s + (n.height || fallbackH), 0) / nodes.length;
	return { w, h };
}

function makeOverlapTest(
	nodes: NodeRect[],
	nodeW: number,
	nodeH: number,
	padding: number,
): (cx: number, cy: number) => boolean {
	return (cx, cy) =>
		nodes.some((n) => {
			const nw = n.width || DEFAULT_NODE_WIDTH;
			const nh = n.height || DEFAULT_NODE_HEIGHT;
			return (
				cx < n.x + nw + padding &&
				cx + nodeW + padding > n.x &&
				cy < n.y + nh + padding &&
				cy + nodeH + padding > n.y
			);
		});
}

function isInsideViewport(
	cx: number,
	cy: number,
	w: number,
	h: number,
	vp: ViewportBounds,
): boolean {
	return (
		cx >= vp.left + VIEWPORT_INSET &&
		cy >= vp.top + VIEWPORT_INSET &&
		cx + w <= vp.right - VIEWPORT_INSET &&
		cy + h <= vp.bottom - VIEWPORT_INSET
	);
}

function spiralSearch(
	x: number,
	y: number,
	w: number,
	h: number,
	overlaps: (cx: number, cy: number) => boolean,
	viewport?: ViewportBounds,
): Coordinates | null {
	if (!overlaps(x, y) && (!viewport || isInsideViewport(x, y, w, h, viewport)))
		return { x, y };

	const step = Math.max(w, h) / 2 + FULL_PADDING;
	for (let ring = 1; ring <= MAX_RINGS; ring++) {
		const distance = step * ring;
		const candidates = ring * 8;
		for (let index = 0; index < candidates; index++) {
			const angle = (2 * Math.PI * index) / candidates;
			const cx = x + Math.cos(angle) * distance;
			const cy = y + Math.sin(angle) * distance;
			if (
				!overlaps(cx, cy) &&
				(!viewport || isInsideViewport(cx, cy, w, h, viewport))
			)
				return { x: cx, y: cy };
		}
	}
	return null;
}

/**
 * Find a free position for a new node that avoids overlapping existing nodes.
 *
 * **Pass 1** — strict: full padding, must stay inside the viewport.
 * **Pass 2** — relaxed: reduced padding (allows partial overlap), viewport
 * constraint is dropped so the node always lands *somewhere*.
 *
 * Falls back to placing below all existing nodes if both passes fail.
 */
export function findFreePosition(
	options: FindFreePositionOptions,
): Coordinates {
	const { x, y, nodes, viewport, estimatedWidth, estimatedHeight } = options;
	const { w, h } = estimateSize(
		nodes,
		estimatedWidth ?? DEFAULT_NODE_WIDTH,
		estimatedHeight ?? DEFAULT_NODE_HEIGHT,
	);

	// Pass 1 — strict: full padding + viewport bounds
	const strictOverlaps = makeOverlapTest(nodes, w, h, FULL_PADDING);
	const strict = spiralSearch(x, y, w, h, strictOverlaps, viewport);
	if (strict) return strict;

	// Pass 2 — relaxed: allow partial overlap, ignore viewport
	const relaxedPadding = -(Math.min(w, h) * RELAXED_OVERLAP_RATIO);
	const relaxedOverlaps = makeOverlapTest(nodes, w, h, relaxedPadding);
	const relaxed = spiralSearch(x, y, w, h, relaxedOverlaps);
	if (relaxed) return relaxed;

	// Fallback: place below all existing nodes
	const maxY = Math.max(
		...nodes.map((n) => n.y + (n.height || DEFAULT_NODE_HEIGHT)),
		y,
	);
	return { x, y: maxY + FULL_PADDING };
}
