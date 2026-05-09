import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { reaction } from 'signal-utils/subtle/reaction';
import { signal } from '@lit-labs/signals';
import { type HTMLTemplateResult } from 'lit';
import { Node } from '@node-flow-elements/core/node';
import type { NodeConstructorParameters } from '@node-flow-elements/core/types';
import { defineNode, definePort } from '@node-flow-elements/core/types';

const templateNodeDefinition = defineNode({
	type: 'NfWaTemplateNode',
	defaultDisplayName: 'Template',
	defaultIcon: 'braces',
	helpText: 'Use {{varName}} to create dynamic input ports from the template.',
	ports: {
		output: definePort<string>({
			direction: 'out',
			customDisplayName: 'Output',
			initialValue: '',
		}),
	},
});

export class NfWaTemplateNode extends Node<typeof templateNodeDefinition> {
	public static override readonly definition = templateNodeDefinition;

	readonly #templateText = signal<string>('');

	constructor(options: NodeConstructorParameters<NfWaTemplateNode>) {
		super(options);

		// Restore template text from serialised data *after* super() so that the
		// private field #templateText is initialised before we access it.
		// options.data carries the extra `templateText` field emitted by toJSON().
		const initialText = (options.data as Record<string, unknown> | undefined)
			?.templateText;
		if (typeof initialText === 'string' && initialText) {
			this.#templateText.set(initialText);
			// Synchronously publish ports so Flow's connection-restoration pass
			// can find them immediately after the constructor returns.
			this.#syncPorts(initialText);
			// Pre-compute the output value so the connection-restoration pass
			// pushes a meaningful string (not '') to connected ports.
			this.#computeOutput();
		}

		// React to template text changes OR any dynamic input port value changes
		// and keep the output port up to date.
		reaction(
			() => {
				const tmpl = this.#templateText.get();
				const ports = this.$ports.get();
				// Tracking each input port's $value here means the reaction re-runs
				// whenever a connected upstream node pushes a new value.
				return [
					tmpl,
					...Object.entries(ports)
						.filter(([k]) => k !== 'output')
						.map(([, p]) => p.value),
				];
			},
			() => this.#computeOutput(),
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	static #parseMustache(text: string): string[] {
		return [...new Set([...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]))];
	}

	#syncPorts(text: string): void {
		const wanted = new Set(NfWaTemplateNode.#parseMustache(text));
		const current = new Set(
			Object.keys(this.$ports.get()).filter((k) => k !== 'output'),
		);
		for (const k of current) if (!wanted.has(k)) this.retractPort(k);
		for (const k of wanted)
			if (!current.has(k)) {
				const port = this.publishPort(k, {
					direction: 'in',
					customDisplayName: k,
				});
				// Patch updateValue so output re-computes synchronously on any push.
				const origUpdate = port.updateValue.bind(port);
				port.updateValue = (value: unknown) => {
					origUpdate(value);
					this.#computeOutput();
				};
			}
	}

	#computeOutput(): void {
		const tmpl = this.#templateText.get();
		const ports = this.$ports.get();
		const result = tmpl.replaceAll(/{{(\w+)}}/g, (_, k: string) =>
			String(ports[k]?.value ?? ''),
		);
		this.ports.output.updateValue(result);
	}

	// ── Public API ────────────────────────────────────────────────────────────

	/** Update the template string and sync dynamic ports accordingly. */
	public updateTemplate(text: string): void {
		this.#templateText.set(text);
		this.#syncPorts(text);
		// Compute and propagate output synchronously so value flows immediately
		// (the async reaction is a safety net for upstream port value changes).
		this.#computeOutput();
		this.flow.dispatch(this.updateTemplate.name, [text], this);
	}

	// ── Serialisation ─────────────────────────────────────────────────────────

	public override toJSON(): ReturnType<Node['toJSON']> & {
		templateText: string;
	} {
		return {
			...super.toJSON(),
			templateText: this.#templateText.get(),
		};
	}

	// ── Template ──────────────────────────────────────────────────────────────

	public override readonly Template = (): HTMLTemplateResult => (
		<nf-wa-node slot={this.slotName} _:node={this}>
			<wa-textarea
				rows={3}
				placeholder="Hello {{name}}!"
				_:value={this.#templateText.get()}
				on:input={(event: Event) =>
					this.updateTemplate((event.target as HTMLInputElement).value)
				}
			/>
		</nf-wa-node>
	);
}
