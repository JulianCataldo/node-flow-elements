import type dagre from '@dagrejs/dagre';

import type { Node } from '../node.js';
import type { Port } from '../port.js';
import type { GenericFlow } from '../types.js';

export interface AutoLayoutOptions {
	/** Graph direction: left-to-right, top-to-bottom, etc. */
	direction?: 'LR' | 'RL' | 'TB' | 'BT';
	/** Horizontal spacing between nodes (pixels). */
	nodeSpacingX?: number;
	/** Vertical spacing between nodes (pixels). */
	nodeSpacingY?: number;
	/** Animate the transition (ms). Set to 0 to disable. */
	animationDuration?: number;
}

const DEFAULTS = {
	direction: 'LR',
	nodeSpacingX: 80,
	nodeSpacingY: 50,
	animationDuration: 350,
} as const satisfies Required<AutoLayoutOptions>;

/**
 * For each node that receives multiple inbound edges from distinct source nodes,
 * reorder the source nodes' y-positions so they match the vertical order of the
 * target's input ports. This prevents cable crossings that dagre cannot avoid
 * because it has no knowledge of individual port positions within a node.
 */
function fixPortCrossings(
	flow: GenericFlow,
	direction: AutoLayoutOptions['direction'],
): void {
	const isHorizontal = direction === 'LR' || direction === 'RL';

	// Group incoming links by target node.
	const incomingByTarget = new Map<
		string,
		{ sourceNode: Node; targetPort: Port }[]
	>();

	for (const link of flow.links.list) {
		const targetId = link.to.node.id;
		let list = incomingByTarget.get(targetId);
		if (!list) {
			list = [];
			incomingByTarget.set(targetId, list);
		}
		list.push({ sourceNode: link.from.node, targetPort: link.to });
	}

	for (const [, entries] of incomingByTarget) {
		if (entries.length < 2) continue;

		const targetNode = entries[0].targetPort.node;
		// Get port definition order (top-to-bottom in DOM).
		const portOrder = Object.values(targetNode.ports).filter(
			(p) => p.direction === 'in' || p.direction === 'both',
		);

		// Sort entries by the target port's definition order.
		entries.sort(
			(a, b) =>
				portOrder.indexOf(a.targetPort) - portOrder.indexOf(b.targetPort),
		);

		// Collect current positions of the source nodes along the cross-axis,
		// sort them, then reassign so the order matches port order.
		const positions = entries
			.map((event) =>
				isHorizontal ? event.sourceNode.$y.get() : event.sourceNode.$x.get(),
			)
			.sort((a, b) => a - b);

		for (const [index, entry] of entries.entries()) {
			if (isHorizontal) entry.sourceNode.$y.set(positions[index]);
			else entry.sourceNode.$x.set(positions[index]);
		}
	}
}

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/**
 * Apply a dagre-based automatic layout to all nodes in the flow.
 *
 * Dynamically imports `@dagrejs/dagre` so it remains an optional peer dep.
 */
export async function autoLayout(
	flow: GenericFlow,
	options?: AutoLayoutOptions,
): Promise<void> {
	const { direction, nodeSpacingX, nodeSpacingY, animationDuration } = {
		...DEFAULTS,
		...options,
	};

	let dagreLibrary: typeof dagre;
	try {
		const library = await import('@dagrejs/dagre');
		dagreLibrary = library.default;
	} catch {
		throw new Error(
			'Auto-layout requires "@dagrejs/dagre". Install it with: npm add @dagrejs/dagre',
		);
	}

	const g = new dagreLibrary.graphlib.Graph();

	g.setGraph({
		rankdir: direction,
		nodesep: nodeSpacingY,
		ranksep: nodeSpacingX,
		marginx: 20,
		marginy: 20,
	});

	g.setDefaultEdgeLabel(() => ({}));

	const nodeMap = new Map<string, Node>();

	for (const node of flow.nodes.list) {
		nodeMap.set(node.id, node);

		// Use measured DOM size when available, otherwise a sensible fallback.
		const width = node.width || 200;
		const height = node.height || 60;

		g.setNode(node.id, { width, height });
	}

	for (const link of flow.links.list) {
		const sourceNodeId = link.from.node.id;
		const targetNodeId = link.to.node.id;

		g.setEdge(sourceNodeId, targetNodeId);
	}

	dagreLibrary.layout(g);

	// Save original positions before any mutation
	const origins = new Map<Node, { x: number; y: number }>();
	for (const node of flow.nodes.list) {
		origins.set(node, { x: node.$x.get(), y: node.$y.get() });
	}

	const targets = new Map<Node, { x: number; y: number }>();

	for (const nodeId of g.nodes()) {
		const layoutNode = g.node(nodeId);
		const node = nodeMap.get(nodeId);
		if (!node || !layoutNode) continue;

		targets.set(node, {
			x: layoutNode.x - layoutNode.width / 2,
			y: layoutNode.y - layoutNode.height / 2,
		});
	}

	// Apply dagre positions temporarily so fixPortCrossings can reorder.
	for (const [node, pos] of targets) {
		node.$x.set(pos.x);
		node.$y.set(pos.y);
	}
	fixPortCrossings(flow, direction);
	// Read back corrected positions as final targets.
	for (const [node] of targets) {
		targets.set(node, { x: node.$x.get(), y: node.$y.get() });
	}

	// Restore originals so animation starts from the visual state.
	for (const [node, pos] of origins) {
		node.$x.set(pos.x);
		node.$y.set(pos.y);
	}

	await animatePositions(origins, targets, animationDuration);
}

async function animatePositions(
	origins: Map<Node, { x: number; y: number }>,
	targets: Map<Node, { x: number; y: number }>,
	duration: number,
): Promise<void> {
	if (targets.size === 0) return;

	if (duration <= 0) {
		for (const [node, pos] of targets) {
			node.$x.set(pos.x);
			node.$y.set(pos.y);
		}
		return;
	}

	return new Promise<void>((resolve) => {
		const start = performance.now();

		function tick(now: number): void {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutCubic(progress);

			for (const [node, target] of targets) {
				const origin = origins.get(node)!;
				node.$x.set(origin.x + (target.x - origin.x) * eased);
				node.$y.set(origin.y + (target.y - origin.y) * eased);
			}

			if (progress < 1) {
				requestAnimationFrame(tick);
			} else {
				resolve();
			}
		}

		requestAnimationFrame(tick);
	});
}
