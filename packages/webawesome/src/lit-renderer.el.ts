import { LitElement, css, type HTMLTemplateResult } from 'lit';

export class LitRenderer extends LitElement {
	static styles = [
		css`
			:host {
				display: contents;
			}
		`,
	];

	static override properties = { template: { attribute: false } };
	declare template?: HTMLTemplateResult | null;

	public override render(): HTMLTemplateResult | null {
		return this.template || null;
	}
}
customElements.define('lit-renderer', LitRenderer);
