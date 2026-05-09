import { defineRoute } from '@gracile/gracile/route';
import { html } from 'lit';

import { document } from '../document.js';
// import * as readme from '../../README.md';
// import { SideMenu } from '../features/side-menu.js';

// prettier-ignore
// const title = <><span>{'<'}</span>Node<span>-</span>Flow<span>-</span>Elements<span>{'>'}</span></>

export default defineRoute({
  document: () => document(),


  template:()=> html`Nothing`
  // template: () => (
  //   <div class="root">
  //     <SideMenu
  //       toc={readme.meta.tableOfContents.at(0)?.children || []}
  //       title={title}
  //     />
  //     <main class="main">
  //       <article $:html={readme.body.html} />
  //       <hr />
  //       This documentation was built with{' '}
  //       <a href="https://gracile.js.org">Gracile</a>.
  //     </main>
  //   </div>
  // ),
});
