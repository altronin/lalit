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

(function () {
	'use strict';

	/* ---------------- Mobile nav ---------------- */
	const trigger = document.querySelector('.menu_trigger');
	const menu = document.querySelector('.nav-menu');

	if (trigger && menu) {
		trigger.addEventListener('click', function (e) {
			e.preventDefault();
			menu.classList.toggle('active');
		});

		document.querySelectorAll('.nav-menu a').forEach(function (link) {
			link.addEventListener('click', function () {
				menu.classList.remove('active');
			});
		});

		document.addEventListener('click', function (e) {
			if (menu.classList.contains('active') &&
				!menu.contains(e.target) &&
				!trigger.contains(e.target)) {
				menu.classList.remove('active');
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
			applyTheme(next);
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

	/* ---------------- Reveal-on-scroll ---------------- */
	const revealTargets = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && revealTargets.length) {
		const io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			});
		}, { threshold: 0.1 });
		revealTargets.forEach(function (el) { io.observe(el); });
	} else {
		revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
	}

	/* ---------------- Footer year ---------------- */
	const yearEl = document.getElementById('current-year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
