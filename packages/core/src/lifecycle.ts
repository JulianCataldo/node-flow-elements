/* eslint-disable @typescript-eslint/no-explicit-any */
import { reaction } from 'signal-utils/subtle/reaction';

import type { Flow } from './flow.js';
import type { Link } from './types.js';
import type { Node } from './node.js';

/**
 * Per-entity lifecycle adapter.
 *
 * Diffs `flow.$nodes` and `flow.$links` over time and invokes
 * `onNode(node)` / `onLink(link)` once per appearance, returning a per-entity
 * `dispose` callback that fires when the entity disappears (and once more on
 * `unsubscribe()`).
 *
 * Node identity: `node` reference (object identity).
 * Link identity: `${from.id}__${to.id}` (out-only, single direction).
 *
 * Use this to spawn one adapter per entity (e.g. one Yjs Y.Map per Node, one
 * effect-based watcher per Port value, etc.) without re-doing your own diff.
 */
export function bindEntityLifecycle(
	flow: Flow<any>,
	options: {
		onNode?: (node: Node) => (() => void) | void;
		onLink?: (link: Link) => (() => void) | void;
	},
): () => void {
	const nodeDisposers = new Map<Node, (() => void) | void>();
	const linkDisposers = new Map<
		string,
		{ link: Link; dispose: (() => void) | void }
	>();

	const linkKey = (link: Link): string => `${link.from.id}__${link.to.id}`;

	const reconcileNodes = (): void => {
		const onNode = options.onNode;
		if (!onNode) return;
		const current = new Set(flow.nodes.list);
		for (const node of current) {
			if (!nodeDisposers.has(node)) {
				nodeDisposers.set(node, onNode(node));
			}
		}
		for (const [node, dispose] of nodeDisposers) {
			if (!current.has(node)) {
				try {
					dispose?.();
				} catch {
					/* swallow */
				}
				nodeDisposers.delete(node);
			}
		}
	};

	const reconcileLinks = (): void => {
		const onLink = options.onLink;
		if (!onLink) return;
		const seen = new Set<string>();
		for (const link of flow.links.list) {
			const key = linkKey(link);
			seen.add(key);
			if (!linkDisposers.has(key)) {
				linkDisposers.set(key, {
					link,
					dispose: onLink(link),
				});
			}
		}
		for (const [key, entry] of linkDisposers) {
			if (!seen.has(key)) {
				try {
					entry.dispose?.();
				} catch {
					/* swallow */
				}
				linkDisposers.delete(key);
			}
		}
	};

	let nodesDisposer: (() => void) | undefined;
	let linksDisposer: (() => void) | undefined;

	if (options.onNode) {
		reconcileNodes();
		nodesDisposer = reaction(
			() => flow.nodes.list,
			() => reconcileNodes(),
		) as unknown as () => void;
	}

	if (options.onLink) {
		reconcileLinks();
		linksDisposer = reaction(
			() => flow.links.list,
			() => reconcileLinks(),
		) as unknown as () => void;
	}

	return () => {
		nodesDisposer?.();
		linksDisposer?.();
		for (const dispose of nodeDisposers.values()) {
			try {
				dispose?.();
			} catch {
				/* swallow */
			}
		}
		nodeDisposers.clear();
		for (const entry of linkDisposers.values()) {
			try {
				entry.dispose?.();
			} catch {
				/* swallow */
			}
		}
		linkDisposers.clear();
	};
}
