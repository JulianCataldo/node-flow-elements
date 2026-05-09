// import { signal, SignalWatcher } from '@lit-labs/signals';

// import '../features/wa-theme.js';

// import { Flow } from '../lib/flow.js';
// import * as presets from '../lib/themes/webawesome/demo-nodes/presets/index.js';

// import { LitElement, css } from 'lit';
// import { customElement, property } from 'lit/decorators.js';

// import * as readme from '../../README.md';

// import '../features/demo-nf-wa.js';

// type Syntax = 'react' | 'lit' | 'lit-jsx';
// const currentSyntaxKey = 'nfe:current-syntax';
// const mode = signal<Syntax>(
//   (localStorage.getItem(currentSyntaxKey) as Syntax) || 'lit-jsx',
// );

// const blocks = await Promise.all(
//   readme.codeFiles.map(
//     async (file) => ({
//       m: await file.module(),
//       path: file.path /* name: code.meta.at(0) */,
//     }),
//     // file.lang === 'TSX'
//     // ?
//     // : null,
//   ),
// );

// console.log({
//   currentSyntax: localStorage.getItem('nfe:current-syntax'),
// });

// @customElement('code-runner')
// export class Demo1 extends SignalWatcher(LitElement) {
//   static styles = [
//     css`
//       :host {
//         display: block;
//         /* max-height: 50vh; */
//       }

//       main {
//         height: 100%;
//         width: 100%;
//         border-radius: 1rem;
//         overflow: hidden;
//       }

//       .wrapper {
//         display: flex;
//         flex-wrap: wrap;
//         gap: 1rem;
//       }

//       .code {
//         max-width: 80ch;
//         flex-grow: 1;
//         max-height: 80vh;
//       }

//       wa-tab-panel {
//         /* overflow-y: scroll; */
//         /* &::part(base) {
//           padding: 0;
//         } */
//         --padding: 0;
//       }

//       /* wa-tab-panel::part(base) {
//         padding: 0;
//       } */

//       .preview {
//         min-height: 35rem;
//         min-width: 35rem;
//         /* max-width: 50rem; */
//         flex-grow: 1;
//         overflow: hidden;
//         border-radius: var(
//           --wa-border-radius-x-large,
//           var(--sl-border-radius-x-large)
//         );
//       }
//     `,
//   ];

//   flow = new Flow(presets.defaultPreset);

//   @property() accessor import: string | null = null;

//   render() {
//     const imported = blocks
//       .find((block) => block.path === this.import)
//       ?.m.App();

//     return (
//       <div class="wrapper">
//         <div class="code">
//           <wa-tab-group
//             // HACK: Typings
//             on:wa-tab-show={(event: any) => {
//               const name = event.detail.name as Syntax;
//               mode.set(name);
//               localStorage.setItem(currentSyntaxKey, name);
//             }}
//           >
//             <wa-tab
//               slot="nav"
//               panel="react"
//               bool:active={mode.get() === 'react'}
//             >
//               React
//             </wa-tab>
//             <wa-tab
//               slot="nav"
//               panel="lit-jsx"
//               bool:active={mode.get() === 'lit-jsx'}
//             >
//               Lit JSX
//             </wa-tab>
//             <wa-tab slot="nav" panel="lit" bool:active={mode.get() === 'lit'}>
//               Lit HTML
//             </wa-tab>

//             <wa-tab-panel name="react">
//               <slot name="react"></slot>
//             </wa-tab-panel>
//             <wa-tab-panel name="lit-jsx">
//               <slot name="lit-jsx"></slot>
//             </wa-tab-panel>
//             <wa-tab-panel name="lit">
//               <slot name="lit"></slot>
//             </wa-tab-panel>
//             {/* TODO: */}
//             {/* <wa-tab-panel name="vue">
//               <slot name="vue"></slot>
//             </wa-tab-panel> */}
//           </wa-tab-group>
//         </div>

//         {imported ? (
//           <div class="preview">
//             {/* FIXME: Typings upstream */}
//             {imported}
//           </div>
//         ) : null}
//       </div>
//     );
//   }
// }
console.log('Hello from home route client!');
