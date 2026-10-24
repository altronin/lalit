/* Friendly extras for the Decap admin panel (loaded after decap-cms.js).
 * - floating "?" help button with short, plain-language tips
 * - a clear "Saved — live in about a minute" message after every save
 * Everything here is optional: if it fails, the CMS itself keeps working.
 */
(function () {
	'use strict';

	/* ---------- toast ---------- */
	var toastTimer = 0;
	function toast(msg) {
		var el = document.getElementById('ad-toast');
		if (!el) {
			el = document.createElement('div');
			el.id = 'ad-toast'; el.className = 'ad-toast';
			el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
			document.body.appendChild(el);
		}
		el.textContent = msg;
		el.classList.add('is-on');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 6000);
	}
	if (window.CMS && CMS.registerEventListener) {
		['postSave', 'postPublish'].forEach(function (name) {
			try {
				CMS.registerEventListener({
					name: name,
					handler: function () { toast('✓ Saved to GitHub — the live website updates in about a minute.'); }
				});
			} catch (e) { /* older/newer builds: ignore */ }
		});
	}

	/* ---------- help dialog ---------- */
	var TIPS = [
		['Saving & publishing', 'Press <b>Publish → Publish now</b> (top right). Your change is saved to GitHub and the live site refreshes in about a minute. Reload the website with Ctrl+Shift+R if you don’t see it yet.'],
		['Adding a video, PDF or slides', 'In any text box click the <b>+</b> button → <b>Embed (video / PDF / slides)</b>. Paste a YouTube, Google Drive or Google Slides link, or upload a PDF. Don’t paste raw &lt;iframe&gt; code unless you must — links are cleaner.'],
		['Dates & order', 'Projects, experience, training and publications sort themselves by date. Write dates like <b>June 2025 - Ongoing</b> or <b>Nov 2022 - July 2023</b>. You never need to drag items into place.'],
		['Images', 'Use photos under about 1 MB (JPG or WebP) so pages load fast, especially on phones. Give files simple names without spaces.'],
		['On your phone', 'Everything works on a phone. Use the tabs at the top to switch between sections, and tap an entry to open it. Long lists are collapsed — tap an item to expand it.'],
		['Something went wrong?', 'Reload the page and sign in again. Your last <i>published</i> version is always safe on GitHub, and every change can be undone from the repository history.']
	];
	function buildHelp() {
		var fab = document.createElement('button');
		fab.type = 'button'; fab.className = 'ad-fab'; fab.setAttribute('aria-label', 'Help and tips');
		fab.innerHTML = '<span aria-hidden="true">?</span>';
		var modal = document.createElement('div');
		modal.className = 'ad-modal'; modal.hidden = true;
		modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'ad-help-title');
		modal.innerHTML = '<div class="ad-modal-card"><div class="ad-modal-head"><h2 id="ad-help-title">Quick tips</h2>' +
			'<button type="button" class="ad-modal-close" aria-label="Close help">×</button></div><div class="ad-modal-body">' +
			TIPS.map(function (t) { return '<section><h3>' + t[0] + '</h3><p>' + t[1] + '</p></section>'; }).join('') +
			'</div></div>';
		function open() { modal.hidden = false; modal.querySelector('.ad-modal-close').focus(); }
		function close() { modal.hidden = true; fab.focus(); }
		fab.addEventListener('click', open);
		modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('.ad-modal-close')) close(); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
		document.body.appendChild(fab); document.body.appendChild(modal);
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildHelp);
	else buildHelp();
})();
