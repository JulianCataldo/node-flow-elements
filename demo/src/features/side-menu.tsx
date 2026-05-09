import type { MarkdownModule } from '@gracile/markdown/module';
import type { HTMLTemplateResult } from 'lit';

export const SideMenu = ({
	toc,
	title,
}: {
	toc: MarkdownModule['meta']['tableOfContents'];
	title: string;
}): HTMLTemplateResult => (
	<aside class="side-menu">
		<a class="title" href="#">
			{title}
		</a>
		<ul>
			{toc.map((h1) => {
				return (
					<li>
						<a href={`#${h1.slug}`} $:html={h1.html} />
						{h1.children ? (
							<ul>
								{h1.children.map((h2) => (
									<li>
										<a href={`#${h2.slug}`} $:html={h2.html} />

										{h2.children ? (
											<ul>
												{h2.children.map((h3) => (
													<li>
														<a href={`#${h3.slug}`} $:html={h3.html} />
													</li>
												))}
											</ul>
										) : null}
									</li>
								))}
							</ul>
						) : null}
					</li>
				);
			})}

			<li>
				<a href="/api/index.html">API reference</a>
				{/* TODO: */}
				{/* <ul>
          <li>
          </li>
          <li>
            <a href="/elements/">HTML Elements</a>
          </li>
        </ul> */}
			</li>
		</ul>

		<hr />

		<a href="https://github.com/JulianCataldo/node-flow-elements">
			Sources (GitHub)
		</a>
	</aside>
);
