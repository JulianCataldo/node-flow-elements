'use html-server';

import {
	html,
	type ServerRenderedTemplate,
} from '@gracile/gracile/server-html';

export const document = (options?: {
	title?: string;
}): ServerRenderedTemplate => {
	return html`
		<!doctype html>
		<html lang="en" class="wa-light wa-theme-shoelace">
			<head>
				<meta charset="utf-8" />
				<link rel="stylesheet" href="/src/document.css" />
				<script type="module" src="/src/document.client.ts"></script>

				<title>${options?.title ?? 'Node Flow Elements | Documentation'}</title>
			</head>

			<body>
				<route-template-outlet></route-template-outlet>
			</body>
		</html>
	`;
	// <html lang="en" class="wa-light wa-theme-shoelace">
	//   <head>
	//     <meta charset="utf-8" />
	//     <link rel="stylesheet" href="/src/document.css" />
	//     <script type="module" src="/src/document.client.ts"></script>

	//     <title>{options?.title ?? 'Node Flow Elements | Documentation'}</title>
	//   </head>

	//   <body>
	//     <route-template-outlet></route-template-outlet>
	//   </body>
	// </html>
};
