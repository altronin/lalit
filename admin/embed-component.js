/* "Embed" component for the Decap CMS rich-text editor.
 *
 * In any Markdown field (blog post body, project overview, publication
 * abstract) click the "+" / "Add component" menu and choose
 * "Embed (video / PDF / slides)". Paste a link — or upload a PDF/PowerPoint —
 * and optionally add a caption. The website turns it into a clean, responsive
 * viewer with Expand / Open / Download buttons.
 *
 * It is stored in the Markdown as one plain line:
 *     {{embed https://youtu.be/XXXXXXXXXXX | Optional caption}}
 * so you can also type it by hand. Rendering lives in js/site.js (lpEmbedHTML).
 *
 * Supported links: YouTube, Vimeo, Google Drive files/folders (share as
 * "Anyone with the link"), Google Slides / Docs / Sheets, PDF links, and
 * PowerPoint / Word / Excel files.
 */
(function () {
	'use strict';
	if (!window.CMS) return;

	function clean(s) { return String(s || '').replace(/[{}|\r\n]/g, ' ').replace(/\s+/g, ' ').trim(); }
	function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

	CMS.registerEditorComponent({
		id: 'embed',
		label: 'Embed (video / PDF / slides)',
		icon: 'play_circle',
		fields: [
			{ name: 'url', label: 'Link', widget: 'string', required: false, hint: 'Paste a YouTube, Vimeo, Google Drive, Google Slides/Docs/Sheets or PDF link. For Drive files set sharing to "Anyone with the link".' },
			{ name: 'file', label: '…or upload a PDF / PowerPoint / Word file', widget: 'file', required: false, hint: 'Optional. If you upload a file, it is used instead of the link above.' },
			{ name: 'caption', label: 'Caption (optional)', widget: 'string', required: false }
		],
		pattern: /^\{\{embed (\S+?)(?: \| ([^}\n]*?))?\}\}$/,
		fromBlock: function (m) {
			var v = m[1] || '';
			var local = !/^[a-z]+:\/\//i.test(v);
			return { url: local ? '' : v, file: local ? v : '', caption: m[2] || '' };
		},
		toBlock: function (o) {
			var u = String(o.file || o.url || '').trim().replace(/\s/g, '%20');
			if (!u) return '';
			var cap = clean(o.caption);
			return '{{embed ' + u + (cap ? ' | ' + cap : '') + '}}';
		},
		toPreview: function (o) {
			var u = o.file || o.url || '(no link yet)';
			return '<div style="padding:14px 16px;border:1px dashed #3a6b52;border-radius:10px;background:#f6f4ee;color:#1c2e45;font-family:sans-serif">' +
				'<strong>▶ Embedded viewer</strong><br><small>' + esc(u) + '</small>' +
				(o.caption ? '<br><em>' + esc(o.caption) + '</em>' : '') + '</div>';
		}
	});
})();
