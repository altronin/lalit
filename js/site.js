/* ==========================================================================
   Lalit Pathak — Shared site behavior
   Loaded on every page. Handles nav, theme, scroll effects, and helpers
   used by the per-page data-rendering scripts.
   ========================================================================== */

// Shared helper: sorts blog post objects newest-first by their `date` field,
// so a new post always appears first without needing manual reordering in the CMS.
function sortPostsByDateDesc(posts) {
	const ts = function (p) { const t = new Date(p.date).getTime(); return isNaN(t) ? 0 : t; };
	return posts.map(function (p, i) { return { p: p, i: i }; })
		.sort(function (a, b) { return (ts(b.p) - ts(a.p)) || (a.i - b.i); })
		.map(function (x) { return x.p; });
}

// ---- Chronological ordering (projects, experience, training, publications) ----
// Items are ordered by their dates automatically, so a new entry lands in the
// right place no matter where it was added in the CMS list. Understands
// "June 2025 - Ongoing", "Nov 2022 - July 2023", "2022-Current", "14 August 2026",
// "23-25 Nov 2022"... Newest start first; if starts tie, the one that runs
// longest (ongoing) comes first; items with no readable date go last, in their
// original order.
const LP_MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function lpParseRange(str) {
	const s = String(str || '').toLowerCase();
	const re = /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(\d{4})/g;
	const stamps = [];
	let m;
	while ((m = re.exec(s))) stamps.push(Date.UTC(+m[2], m[1] ? LP_MONTHS[m[1]] : 0, 1));
	if (!stamps.length) return null;
	const ongoing = /(ongoing|current|present|to date|\bnow\b)/.test(s);
	return { start: stamps[0], end: ongoing ? Infinity : stamps[stamps.length - 1] };
}
function lpSortByDateRange(items, field) {
	field = field || 'date_range';
	return (items || []).map(function (it, i) { return { it: it, i: i, r: lpParseRange(it[field]) }; })
		.sort(function (a, b) {
			if (!a.r && !b.r) return a.i - b.i;
			if (!a.r) return 1;
			if (!b.r) return -1;
			if (b.r.start !== a.r.start) return b.r.start - a.r.start;
			if (b.r.end !== a.r.end) return b.r.end > a.r.end ? 1 : -1;
			return a.i - b.i;
		}).map(function (x) { return x.it; });
}
// Publications carry their year at the end of the citation: "... 129 (2026)".
function lpSortPubsByYear(items) {
	return (items || []).map(function (it, i) { return { it: it, i: i, y: parseInt(lpPubYear(it), 10) || 0 }; })
		.sort(function (a, b) { return (b.y - a.y) || (a.i - b.i); })
		.map(function (x) { return x.it; });
}

// Small helper reused by every page's fetch() renderer to avoid XSS.
function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str == null ? '' : str;
	// textContent->innerHTML escapes & < > but not quotes; escape those too so the
	// result is also safe inside "double-quoted" HTML attributes (href, title, alt…).
	return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


// ---- Portfolio helpers (shared by portfolio, projects, publications + detail pages) ----
// Slugs are generated from the title automatically, so a new entry added in
// the CMS gets its own detail-page URL with no extra field to fill in. An
// optional `slug` field in the CMS overrides it (use that if you later edit a
// title but want the old link to keep working).
function lpSlugify(str) {
	return String(str || '').toLowerCase()
		.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}
function lpItemSlug(item) { return (item.slug && item.slug.trim()) ? item.slug.trim() : lpSlugify(item.title); }
function lpPubYear(item) { const m = String(item.journal || '').match(/\((\d{4})\)\s*$/); return m ? m[1] : ''; }
function lpPubHref(item) { return 'publication.html?pub=' + encodeURIComponent(lpItemSlug(item)); }
function lpProjectHref(item) { return 'project.html?project=' + encodeURIComponent(lpItemSlug(item)); }
// One publication row (used by portfolio.html and publications.html). The two
// links sit in their own flex row so they never collide with the hanging indent.
function pubItemHTML(item) {
	const year = lpPubYear(item);
	const link = lpSafeUrl(item.link);
	const citations = (item.citations === null || item.citations === undefined) ? ''
		: `<span class="publication-citations"><i class="fas fa-quote-right" aria-hidden="true"></i> Cited by ${escapeHTML(item.citations)}</span>`;
	return `
		<div class="publication-item">
			<div class="publication-ref">
				${year ? `<span class="pub-year">${escapeHTML(year)}</span>` : ''}
				<span class="publication-authors">${escapeHTML(item.authors)}</span>
				&mdash; <span class="publication-title"><a href="${escapeHTML(lpPubHref(item))}">${escapeHTML(item.title)}.</a></span>
				<span class="publication-journal">${escapeHTML(item.journal)}.</span>
			</div>
			<div class="publication-links">
				<a href="${escapeHTML(lpPubHref(item))}" class="publication-link">Abstract &amp; details &rarr;</a>
				${link ? `<a href="${escapeHTML(link)}" class="publication-link" target="_blank" rel="noopener noreferrer">DOI / publisher &nearr;</a>` : ''}
				${citations}
			</div>
		</div>`;
}
window.pubItemHTML = pubItemHTML;
// Markdown -> sanitized HTML (needs marked + DOMPurify loaded on the page).
// Also turns the CMS "Embed" component — a line like
//   {{embed https://youtu.be/xxxx | Optional caption}}
// — into a responsive viewer (YouTube, Vimeo, Google Drive / Docs / Slides,
// PDF, PowerPoint/Word/Excel). Embeds are built here from a validated URL, never
// copied from user HTML, so DOMPurify can keep stripping every <iframe> from
// the Markdown itself.
function lpMarkdown(md) {
	const specs = [];
	const prepared = String(md || '').replace(/^[ \t]*\{\{\s*embed\s+(\S+?)(?:\s*\|\s*([^}\n]*?))?\s*\}\}[ \t]*$/gmi, function (_, url, caption) {
		specs.push({ url: url, caption: caption || '' });
		return '\n\nLPEMBEDTOKEN' + (specs.length - 1) + 'X\n\n';
	});
	let html = DOMPurify.sanitize(marked.parse(prepared), {
		ADD_TAGS: ['video', 'source'],
		ADD_ATTR: ['controls', 'autoplay', 'loop', 'muted', 'playsinline', 'poster']
	});
	specs.forEach(function (spec, i) {
		const token = 'LPEMBEDTOKEN' + i + 'X';
		const out = lpEmbedHTML(spec.url, spec.caption);
		html = html.replace('<p>' + token + '</p>', out).replace(token, out);
	});
	return html;
}

// Works out how to show one URL. Returns null when it isn't something we can
// embed (the caller then shows a plain "Open link" card).
function lpEmbedSpec(raw) {
	let u;
	try { u = new URL(String(raw || '').trim(), window.location.href); } catch (e) { return null; }
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
	const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
	const path = u.pathname;
	const ok = function (re, s) { return re.test(s); };

	// YouTube
	let yt = null;
	if (host === 'youtu.be') yt = path.slice(1).split('/')[0];
	else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		const m = path.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/);
		yt = m ? m[1] : u.searchParams.get('v');
		if (!yt && u.searchParams.get('list') && ok(/^\/playlist/, path)) {
			const list = u.searchParams.get('list');
			if (ok(/^[\w-]+$/, list)) return { kind: 'video', ratio: '16 / 9', label: 'YouTube playlist', open: u.href, src: 'https://www.youtube-nocookie.com/embed/videoseries?list=' + list };
		}
	}
	if (yt && ok(/^[\w-]{6,}$/, yt)) {
		const t = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '0', 10);
		return { kind: 'video', ratio: '16 / 9', label: 'YouTube video', open: u.href, src: 'https://www.youtube-nocookie.com/embed/' + yt + '?rel=0' + (t > 0 ? '&start=' + t : '') };
	}

	// Vimeo
	if (host === 'vimeo.com' || host === 'player.vimeo.com') {
		const m = path.match(/(\d{5,})/);
		if (m) return { kind: 'video', ratio: '16 / 9', label: 'Vimeo video', open: u.href, src: 'https://player.vimeo.com/video/' + m[1] };
	}

	// Google Drive (a shared PDF, PowerPoint, Word file, video or folder)
	if (host === 'drive.google.com') {
		let m = path.match(/\/file\/d\/([\w-]+)/);
		const id = m ? m[1] : u.searchParams.get('id');
		if (id && ok(/^[\w-]+$/, id) && !ok(/\/folders\//, path)) return { kind: 'doc', ratio: '', label: 'Google Drive file', open: 'https://drive.google.com/file/d/' + id + '/view', src: 'https://drive.google.com/file/d/' + id + '/preview' };
		m = path.match(/\/folders\/([\w-]+)/);
		if (m) return { kind: 'doc', ratio: '', label: 'Google Drive folder', open: u.href, src: 'https://drive.google.com/embeddedfolderview?id=' + m[1] + '#grid' };
	}

	// Google Slides / Docs / Sheets
	if (host === 'docs.google.com') {
		let m = path.match(/^\/presentation\/d\/e\/([\w-]+)/);
		if (m) return { kind: 'slides', ratio: '16 / 9', label: 'Google Slides', open: u.href, src: 'https://docs.google.com/presentation/d/e/' + m[1] + '/embed?start=false&loop=false&delayms=4000' };
		m = path.match(/^\/presentation\/d\/([\w-]+)/);
		if (m) return { kind: 'slides', ratio: '16 / 9', label: 'Google Slides', open: 'https://docs.google.com/presentation/d/' + m[1] + '/view', src: 'https://docs.google.com/presentation/d/' + m[1] + '/preview' };
		m = path.match(/^\/(document|spreadsheets)\/d\/e\/([\w-]+)/);
		if (m) return { kind: 'doc', ratio: '', label: m[1] === 'document' ? 'Google Doc' : 'Google Sheet', open: u.href, src: 'https://docs.google.com/' + m[1] + '/d/e/' + m[2] + '/pub?embedded=true' };
		m = path.match(/^\/(document|spreadsheets)\/d\/([\w-]+)/);
		if (m) return { kind: 'doc', ratio: '', label: m[1] === 'document' ? 'Google Doc' : 'Google Sheet', open: u.href, src: 'https://docs.google.com/' + m[1] + '/d/' + m[2] + '/preview' };
	}

	// Files by extension
	const sameSite = u.origin === window.location.origin;
	if (ok(/\.pdf$/i, path)) {
		if (sameSite) return { kind: 'pdf', ratio: '', label: 'PDF', open: u.href, local: u.href, src: u.href };
		return { kind: 'pdf', ratio: '', label: 'PDF', open: u.href, src: 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(u.href) };
	}
	if (ok(/\.(pptx?|docx?|xlsx?)$/i, path)) {
		const label = ok(/\.pptx?$/i, path) ? 'PowerPoint' : ok(/\.docx?$/i, path) ? 'Word document' : 'Excel sheet';
		return { kind: ok(/\.pptx?$/i, path) ? 'slides' : 'doc', ratio: ok(/\.pptx?$/i, path) ? '16 / 9' : '', label: label, open: u.href, src: 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(u.href) };
	}
	return null;
}

function lpEmbedHTML(rawUrl, caption) {
	const spec = lpEmbedSpec(rawUrl);
	const cap = caption ? `<span class="lp-embed-caption">${escapeHTML(caption)}</span>` : '<span class="lp-embed-caption"></span>';
	if (!spec) {
		const safe = lpSafeUrl(rawUrl);
		return safe
			? `<p class="lp-embed-link"><a class="btn-link" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-up-right-from-square" aria-hidden="true"></i> ${escapeHTML(caption || 'Open link')}</a></p>`
			: '';
	}
	const style = spec.ratio ? ` style="--ratio:${spec.ratio}"` : '';
	const title = escapeHTML(caption || spec.label);
	// PDFs hosted on this site get a custom page-by-page viewer (PDF.js): no
	// browser toolbar, so no download / print buttons — just view and flip.
	if (spec.local) {
		return `
	<figure class="lp-embed lp-embed--pdf lp-pdf" data-pdf-src="${escapeHTML(spec.local)}" tabindex="0" aria-label="${title}">
		<div class="lp-pdf-stage">
			<div class="lp-embed-loading" aria-hidden="true"><span></span></div>
			<canvas class="lp-pdf-canvas" role="img" aria-label="${title}"></canvas>
			<button type="button" class="lp-pdf-nav prev" aria-label="Previous page" disabled><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
			<button type="button" class="lp-pdf-nav next" aria-label="Next page" disabled><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
		</div>
		<figcaption class="lp-embed-bar">
			<span class="lp-embed-type"><i class="fas fa-file-lines" aria-hidden="true"></i> PDF</span>
			${cap}
			<span class="lp-embed-actions">
				<span class="lp-pdf-count" aria-live="polite">…</span>
				<button type="button" class="lp-embed-expand" aria-label="Expand to full screen"><i class="fas fa-expand" aria-hidden="true"></i><span>Expand</span></button>
			</span>
		</figcaption>
	</figure>`;
	}
	return `
	<figure class="lp-embed lp-embed--${spec.kind}${spec.ratio ? ' has-ratio' : ''}"${style}>
		<div class="lp-embed-frame">
			<div class="lp-embed-loading" aria-hidden="true"><span></span></div>
			<iframe src="${escapeHTML(spec.src)}" title="${title}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture; encrypted-media"></iframe>
		</div>
		<figcaption class="lp-embed-bar">
			<span class="lp-embed-type"><i class="fas ${spec.kind === 'video' ? 'fa-circle-play' : spec.kind === 'slides' ? 'fa-display' : 'fa-file-lines'}" aria-hidden="true"></i> ${escapeHTML(spec.label)}</span>
			${cap}
			<span class="lp-embed-actions">
				<button type="button" class="lp-embed-expand" aria-label="Expand to full screen"><i class="fas fa-expand" aria-hidden="true"></i><span>Expand</span></button>
				<a href="${escapeHTML(spec.open)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-up-right-from-square" aria-hidden="true"></i><span>Open</span></a>
				
			</span>
		</figcaption>
	</figure>`;
}
window.lpEmbedSpec = lpEmbedSpec; window.lpEmbedHTML = lpEmbedHTML;
window.lpParseRange = lpParseRange; window.lpSortByDateRange = lpSortByDateRange; window.lpSortPubsByYear = lpSortPubsByYear;

// Full-screen toggle for embeds (handy for slides and PDFs on a phone).
document.addEventListener('click', function (e) {
	const btn = e.target.closest && e.target.closest('.lp-embed-expand');
	if (btn) {
		const fig = btn.closest('.lp-embed');
		const on = fig.classList.toggle('is-expanded');
		document.body.classList.toggle('lp-embed-lock', on);
		btn.querySelector('span').textContent = on ? 'Close' : 'Expand';
		btn.querySelector('i').className = 'fas ' + (on ? 'fa-xmark' : 'fa-expand');
	}
});
document.addEventListener('keydown', function (e) {
	if (e.key !== 'Escape') return;
	const open = document.querySelector('.lp-embed.is-expanded');
	if (open) open.querySelector('.lp-embed-expand').click();
});
document.addEventListener('load', function (e) {
	if (e.target && e.target.tagName === 'IFRAME' && e.target.closest('.lp-embed')) e.target.closest('.lp-embed').classList.add('is-ready');
}, true);
// Only allow http(s) links from CMS data into href attributes.
function lpSafeUrl(url) { return /^https?:\/\//i.test(url || '') ? url : ''; }
window.lpSlugify = lpSlugify; window.lpItemSlug = lpItemSlug; window.lpPubYear = lpPubYear;
window.lpPubHref = lpPubHref; window.lpProjectHref = lpProjectHref; window.lpMarkdown = lpMarkdown; window.lpSafeUrl = lpSafeUrl;

// Renders a thumbnail/hero media source as <video> (muted/looping, no audio
// track needed) when it's a .mp4/.webm file, or a lazy <img> otherwise. Lets
// the CMS-editable `image` field point at either an image or a short clip
// without every page needing its own branching markup.
function lpRenderMedia(src, alt, className) {
	const safeSrc = escapeHTML(src || '');
	const safeAlt = escapeHTML(alt || '');
	const cls = className ? ` class="${escapeHTML(className)}"` : '';
	if (/\.(mp4|webm)$/i.test(src || '')) {
		const poster = (src || '').replace(/\.(mp4|webm)$/i, '-poster.jpg');
		return `<video${cls} src="${safeSrc}" poster="${escapeHTML(poster)}" autoplay loop muted playsinline aria-label="${safeAlt}"></video>`;
	}
	return `<img${cls} src="${safeSrc}" alt="${safeAlt}" loading="lazy">`;
}
window.lpRenderMedia = lpRenderMedia;

// Whether the visitor's OS asked for reduced motion — other scripts check this
// before running purely-decorative animation (count-up, stagger delays, etc).
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reusable scroll-reveal: observes `elements`, adding `.is-visible` (which CSS
// transitions in) the first time each one enters the viewport. Used both for
// whole-section .reveal blocks and for per-card .reveal-item grids.
function lpObserveReveal(elements) {
	const list = elements instanceof Element ? [elements] : Array.from(elements);
	if (!list.length) return;
	if (prefersReducedMotion || !('IntersectionObserver' in window)) {
		list.forEach(function (el) { el.classList.add('is-visible'); });
		return;
	}
	// threshold 0 (not 0.1): a tall block — e.g. the blog grid, which is one long
	// column on a phone — can never be "10% visible" at once, so it used to stay
	// invisible (the blank page on mobile). Any pixel in view is enough now.
	const io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				io.unobserve(entry.target);
				// once the entrance has played, drop the stagger delay so later
				// hover/tilt effects respond instantly
				window.setTimeout(function () { entry.target.classList.add('reveal-done'); }, 1200);
			}
		});
	}, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
	list.forEach(function (el) { io.observe(el); });
	// Safety net (odd browsers / in-app webviews): anything already on screen or
	// above the fold after 2s is shown, so content is never left invisible.
	window.setTimeout(function () {
		list.forEach(function (el) {
			if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
		});
	}, 2000);
}

// Call after rendering a grid/list of cards (project-grid, blog-grid, etc.) so
// each child fades in a beat after the previous one instead of all at once.
// `container` is the parent element; `selector` matches the card elements.
function lpRevealItems(container, selector) {
	if (!container) return;
	const items = container.querySelectorAll(selector || ':scope > *');
	items.forEach(function (el, i) {
		el.classList.add('reveal-item');
		el.style.setProperty('--i', i % 10); // cap the stagger so long lists don't take forever
	});
	lpObserveReveal(items);
}

// Animates a number from 0 up to the value already in the element's
// `data-target` attribute once it scrolls into view (used for the homepage
// stats strip). Leaves the text alone if reduced motion is requested.
function lpCountUp(container) {
	const els = (container || document).querySelectorAll('[data-count-target]');
	if (!els.length) return;
	if (prefersReducedMotion || !('IntersectionObserver' in window)) {
		els.forEach(function (el) { el.textContent = el.dataset.countTarget + '+'; });
		return;
	}
	const io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			const el = entry.target;
			io.unobserve(el);
			const target = parseInt(el.dataset.countTarget, 10) || 0;
			const duration = 900;
			const start = performance.now();
			function tick(now) {
				const progress = Math.min(1, (now - start) / duration);
				const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
				el.textContent = Math.round(eased * target) + '+';
				if (progress < 1) requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
		});
	}, { threshold: 0.3 });
	els.forEach(function (el) { io.observe(el); });
}

// Fades a container's content out, swaps it via `renderFn`, then fades back
// in — used when filter buttons or a search box change what a grid shows,
// so results don't just snap-replace.
function lpFadeSwap(container, renderFn) {
	if (!container || prefersReducedMotion) { renderFn(); return; }
	container.style.transition = 'opacity 0.18s ease';
	container.style.opacity = '0';
	window.setTimeout(function () {
		renderFn();
		container.style.opacity = '1';
	}, 180);
}

window.lpObserveReveal = lpObserveReveal;
window.lpRevealItems = lpRevealItems;
window.lpCountUp = lpCountUp;
window.lpFadeSwap = lpFadeSwap;

(function () {
	'use strict';

	/* ---------------- Mobile nav ---------------- */
	const trigger = document.querySelector('.menu_trigger');
	const menu = document.querySelector('.nav-menu');

	if (trigger && menu) {
		trigger.addEventListener('click', function (e) {
			e.preventDefault();
			menu.classList.toggle('active');
			trigger.classList.toggle('is-open');
		});

		document.querySelectorAll('.nav-menu a').forEach(function (link) {
			link.addEventListener('click', function () {
				menu.classList.remove('active');
				trigger.classList.remove('is-open');
			});
		});

		document.addEventListener('click', function (e) {
			if (menu.classList.contains('active') &&
				!menu.contains(e.target) &&
				!trigger.contains(e.target)) {
				menu.classList.remove('active');
				trigger.classList.remove('is-open');
			}
		});
	}

	/* ---------------- Auto-highlight active nav link ---------------- */
	// Works even if a page forgets to hardcode class="active".
	const here = location.pathname.split('/').pop() || 'index.html';
	document.querySelectorAll('.nav-menu a').forEach(function (link) {
		const target = link.getAttribute('href');
		if (target === here || (here === '' && target === 'index.html')) {
			link.classList.add('active');
		}
	});

	/* ---------------- Navbar scroll shadow ---------------- */
	const nav = document.getElementById('nav');
	function onScrollNav() {
		if (!nav) return;
		if (window.scrollY > 50) {
			nav.style.padding = '10px 0';
			nav.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
		} else {
			nav.style.padding = '15px 0';
			nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
		}
	}
	window.addEventListener('scroll', onScrollNav);
	onScrollNav();

	/* ---------------- Dark / light theme toggle ---------------- */
	const THEME_KEY = 'lp-theme';
	const toggleBtn = document.querySelector('.theme-toggle');

	function applyTheme(theme) {
		document.documentElement.setAttribute('data-theme', theme);
		if (toggleBtn) {
			toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
			// aria-pressed reflects "is dark mode currently on", so assistive
			// tech announces the toggle's state, not just its next action.
			toggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
		}
	}

	if (toggleBtn) {
		toggleBtn.addEventListener('click', function () {
			const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
			const next = current === 'dark' ? 'light' : 'dark';
			localStorage.setItem(THEME_KEY, next);
			// Brief rotate/fade on the icon itself so the swap feels intentional
			// rather than an instant flip.
			toggleBtn.classList.add('is-switching');
			window.setTimeout(function () {
				applyTheme(next);
				toggleBtn.classList.remove('is-switching');
			}, prefersReducedMotion ? 0 : 150);
		});
		// Reflect whatever the inline anti-flash script already set.
		applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
	}

	/* ---------------- Back to top button ---------------- */
	let backToTop = document.getElementById('back-to-top');
	if (!backToTop) {
		backToTop = document.createElement('button');
		backToTop.id = 'back-to-top';
		backToTop.type = 'button';
		backToTop.setAttribute('aria-label', 'Back to top');
		backToTop.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
		document.body.appendChild(backToTop);
	}
	window.addEventListener('scroll', function () {
		backToTop.classList.toggle('visible', window.scrollY > 400);
	});
	backToTop.addEventListener('click', function () {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});

	/* ---------------- Reveal-on-scroll (whole sections) ---------------- */
	lpObserveReveal(document.querySelectorAll('.reveal'));
	// Static (non-JS-rendered) staggered cards already in the page markup,
	// e.g. the Contact page's info list — dynamically-rendered grids call
	// lpRevealItems() themselves right after they're built.
	lpObserveReveal(document.querySelectorAll('.reveal-item'));

	/* ---------------- Footer year ---------------- */
	const yearEl = document.getElementById('current-year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	/* ---------------- Reading progress bar (article pages) ---------------- */
	// blog-post.html injects its .blog-article after an async fetch, so this is
	// exposed globally and called once that content lands (see blog-post.html).
	// Static blog_*.html pages that already have the article in the DOM get it
	// immediately below.
	window.lpInitReadingProgress = function (article) {
		article = article || document.querySelector('.blog-article');
		if (!article || document.getElementById('reading-progress')) return;
		const bar = document.createElement('div');
		bar.id = 'reading-progress';
		document.body.appendChild(bar);
		function onScrollProgress() {
			const rect = article.getBoundingClientRect();
			const articleTop = rect.top + window.scrollY;
			const articleHeight = rect.height;
			const viewportBottom = window.scrollY + window.innerHeight;
			const progress = (viewportBottom - articleTop) / articleHeight;
			bar.style.width = Math.max(0, Math.min(1, progress)) * 100 + '%';
		}
		window.addEventListener('scroll', onScrollProgress);
		window.addEventListener('resize', onScrollProgress);
		onScrollProgress();
	};
	if (document.querySelector('.blog-article')) window.lpInitReadingProgress();
})();


// ---- Page-by-page PDF viewer (PDF.js, vendored in js/vendor/pdfjs/) ----
// Draws one page at a time onto a canvas: no toolbar, no download/print
// buttons, right-click disabled. Prev/next arrows, ← → keys and swipe to flip.
// (A file on a public website can always be fetched by a technically
// determined visitor — this removes the buttons, it is not DRM.)
function lpLoadPdfJs() {
	if (window.__lpPdfjs) return window.__lpPdfjs;
	window.__lpPdfjs = new Promise(function (resolve, reject) {
		const el = document.createElement('script');
		el.src = new URL('js/vendor/pdfjs/pdf.min.js', document.baseURI).href;
		el.onload = function () {
			window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('js/vendor/pdfjs/pdf.worker.min.js', document.baseURI).href;
			resolve(window.pdfjsLib);
		};
		el.onerror = reject;
		document.head.appendChild(el);
	});
	return window.__lpPdfjs;
}
function lpInitPdf(fig) {
	if (fig.dataset.init) return;
	fig.dataset.init = '1';
	const stage = fig.querySelector('.lp-pdf-stage');
	const canvas = fig.querySelector('canvas');
	const count = fig.querySelector('.lp-pdf-count');
	const prev = fig.querySelector('.lp-pdf-nav.prev');
	const next = fig.querySelector('.lp-pdf-nav.next');
	let pdf = null, page = 1, busy = false, pending = null, lastKey = '';

	async function show(n) {
		if (!pdf) return;
		n = Math.max(1, Math.min(pdf.numPages, n));
		if (busy) { pending = n; return; }
		busy = true; page = n;
		try {
			const pg = await pdf.getPage(n);
			const v1 = pg.getViewport({ scale: 1 });
			const expanded = fig.classList.contains('is-expanded');
			const w = stage.clientWidth;
			const maxH = expanded ? stage.clientHeight : Math.min(window.innerHeight * 0.78, 820);
			const scale = Math.min(w / v1.width, maxH / v1.height);
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const vp = pg.getViewport({ scale: scale * dpr });
			canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
			canvas.style.width = Math.floor(vp.width / dpr) + 'px';
			canvas.style.height = Math.floor(vp.height / dpr) + 'px';
			await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
			count.textContent = page + ' / ' + pdf.numPages;
			prev.disabled = page <= 1; next.disabled = page >= pdf.numPages;
			lastKey = stage.clientWidth + 'x' + (expanded ? stage.clientHeight : '');
		} catch (e) { /* a cancelled/failed render just leaves the previous page */ }
		busy = false;
		if (pending !== null) { const p = pending; pending = null; show(p); }
	}

	lpLoadPdfJs()
		.then(function (lib) { return lib.getDocument({ url: fig.dataset.pdfSrc, isEvalSupported: false }).promise; })
		.then(function (doc) { pdf = doc; fig.classList.add('is-ready'); return show(1); })
		.catch(function () {
			stage.innerHTML = '<p class="lp-pdf-error">Sorry, this PDF could not be loaded.</p>';
		});

	prev.addEventListener('click', function () { show(page - 1); });
	next.addEventListener('click', function () { show(page + 1); });
	fig.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowRight' || e.key === 'PageDown') { show(page + 1); e.preventDefault(); }
		if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(page - 1); e.preventDefault(); }
	});
	let x0 = null;
	stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
	stage.addEventListener('touchend', function (e) {
		if (x0 === null) return;
		const dx = e.changedTouches[0].clientX - x0; x0 = null;
		if (Math.abs(dx) > 50) show(page + (dx < 0 ? 1 : -1));
	}, { passive: true });
	['contextmenu', 'dragstart'].forEach(function (n) { stage.addEventListener(n, function (e) { e.preventDefault(); }); });

	// Re-draw when the box changes size (rotate phone, Expand / Close, resize)
	let t = 0;
	function onResize() {
		if (!pdf) return;
		const key = stage.clientWidth + 'x' + (fig.classList.contains('is-expanded') ? stage.clientHeight : '');
		if (key === lastKey) return;
		clearTimeout(t); t = setTimeout(function () { show(page); }, 120);
	}
	if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
	else window.addEventListener('resize', onResize);
}
(function () {
	function scan() { document.querySelectorAll('.lp-pdf:not([data-init])').forEach(lpInitPdf); }
	// pages inject post bodies after fetch(), so watch for viewers appearing
	new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
	scan();
})();
