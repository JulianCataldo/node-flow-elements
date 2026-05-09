import '@awesome.me/webawesome/dist/components/animation/animation.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/number-input/number-input.js';

import './node.el.js';
import './port.el.js';

import './extra/navigation.el.js';
import './extra/center.el.js';
import './extra/inventory.el.js';
import './extra/minimap.el.js';

import { css, unsafeCSS } from 'lit';
import { JsonSchemaFormWebawesome } from '@jsfe/webawesome';
import jsfeWaStyles from '@jsfe/webawesome/styles.css' with { type: 'css' };

(class extends JsonSchemaFormWebawesome {
	static override styles = [
		css`
			wa-number-input {
				max-width: 18rem;
			}
		`,
		unsafeCSS(jsfeWaStyles),
	];
}).define();
