/* ==========================================================================
   Lalit Pathak — Shared site behavior
   Loaded on every page. Handles nav, theme, scroll effects, and helpers
   used by the per-page data-rendering scripts.
   ========================================================================== */

// Shared helper: sorts blog post objects newest-first by their `date` field,
// so a new post always appears first without needing manual reordering in the CMS.
function sortPostsByDateDesc(posts) {
	return [...posts].sort(function (a, b) {
		return new Date(b.date) - new Date(a.date);
	});
}

// Small helper reused by every page's fetch() renderer to avoid XSS.
function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str == null ? '' : str;
	return div.innerHTML;
}

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
	const io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				io.unobserve(entry.target);
			}
		});
	}, { threshold: 0.1 });
	list.forEach(function (el) { io.observe(el); });
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
		if (toggleBtn) toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
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
