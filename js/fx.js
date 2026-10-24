/* ==========================================================================
   Lalit Pathak — Motion & micro-interactions
   Loaded before site.js on every page. Pure progressive enhancement:
   - a flow-field "wind / river" particle canvas behind every page header
   - tilt + glare on cards, magnetic buttons, click ripples, cursor spotlight
   - lpDriftRail(): the slowly drifting blog rail on the homepage
   Everything pauses off-screen / in background tabs, is lighter on phones,
   and switches off entirely when the visitor asks for reduced motion.
   ========================================================================== */
(function () {
	'use strict';

	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

	/* ------------------------------------------------------------------
	   1. Flow-field particles (hero background)
	   Particles ride a smoothly changing vector field, like wind over a
	   valley or water through a channel; the pointer (or a finger) parts
	   them like a hand in a stream.
	   ------------------------------------------------------------------ */
	function initFlow(host) {
		var cv = document.createElement('canvas');
		cv.className = 'fx-flow';
		cv.setAttribute('aria-hidden', 'true');
		host.insertBefore(cv, host.firstChild);
		var ctx = cv.getContext('2d');
		if (!ctx) return;

		var w = 0, h = 0, t = 0, raf = 0, running = false, last = 0;
		var parts = [];
		var ptr = { x: -9999, y: -9999, on: false };

		function spawn(p) {
			p = p || {};
			p.x = Math.random() * w; p.y = Math.random() * h;
			p.age = 0; p.life = 120 + Math.random() * 220;
			p.s = 0.55 + Math.random() * 0.75;
			p.gold = Math.random() > 0.84;
			return p;
		}
		function resize() {
			var r = host.getBoundingClientRect();
			var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			w = r.width; h = r.height;
			cv.width = Math.max(1, Math.round(w * dpr));
			cv.height = Math.max(1, Math.round(h * dpr));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			var n = Math.min(coarse ? 50 : 120, Math.round((w * h) / 9500));
			while (parts.length < n) parts.push(spawn());
			parts.length = n;
		}
		function field(x, y) {
			return (Math.sin(x * 0.0036 + t * 0.55) + Math.cos(y * 0.0048 - t * 0.42) + Math.sin((x + y) * 0.0021 + t * 0.3)) * Math.PI * 0.72;
		}
		function frame(now) {
			if (!running) return;
			var dt = Math.min(2.5, (now - last) / 16.7 || 1); last = now;
			t += 0.004 * dt;

			// fade the old trails (keeps the canvas transparent over the gradient)
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fillStyle = 'rgba(0,0,0,0.085)';
			ctx.fillRect(0, 0, w, h);
			ctx.globalCompositeOperation = 'source-over';
			ctx.lineWidth = 1.15;
			ctx.lineCap = 'round';

			var i, p, a, vx, vy, dx, dy, d2, d, f;
			for (var pass = 0; pass < 2; pass++) {
				ctx.beginPath();
				for (i = 0; i < parts.length; i++) {
					p = parts[i];
					if (p.gold !== (pass === 1)) continue;
					a = field(p.x, p.y);
					vx = Math.cos(a) * p.s; vy = Math.sin(a) * p.s;
					if (ptr.on) {
						dx = p.x - ptr.x; dy = p.y - ptr.y; d2 = dx * dx + dy * dy;
						if (d2 < 24000) {
							d = Math.sqrt(d2) || 1; f = (1 - d / 155) * 2.4;
							vx += (dx / d) * f - (dy / d) * f * 0.8;
							vy += (dy / d) * f + (dx / d) * f * 0.8;
						}
					}
					ctx.moveTo(p.x, p.y);
					p.x += vx * dt; p.y += vy * dt; p.age += dt;
					ctx.lineTo(p.x, p.y);
				}
				ctx.strokeStyle = pass === 1 ? 'rgba(214,176,106,0.8)' : 'rgba(214,236,224,0.5)';
				ctx.stroke();
			}
			for (i = 0; i < parts.length; i++) {
				p = parts[i];
				if (p.age > p.life || p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) spawn(p);
			}
			raf = requestAnimationFrame(frame);
		}
		function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
		function stop() { running = false; cancelAnimationFrame(raf); }

		resize();
		if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
		else window.addEventListener('resize', resize);

		host.addEventListener('pointermove', function (e) {
			var r = host.getBoundingClientRect();
			ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true;
		}, { passive: true });
		host.addEventListener('pointerleave', function () { ptr.on = false; });

		var visible = true;
		function sync() { (visible && !document.hidden) ? start() : stop(); }
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { threshold: 0 }).observe(host);
		}
		document.addEventListener('visibilitychange', sync);
		sync();
	}

	/* ------------------------------------------------------------------
	   2. Micro-interactions (delegated, so cards added later work too)
	   ------------------------------------------------------------------ */
	var TILT = '.project-card,.blog-card,.skill-category,.stat-card,.featured-card,.blog-teaser-card,.category-card,.tool-item,.training-card,.experience-content';
	var MAGNET = '.btn,.btn-link,.social a,.theme-toggle,#back-to-top';

	function initPointerFx() {
		var raf = 0, ev = null, cur = null, mag = null;
		var spot = document.createElement('div');
		spot.className = 'fx-spot'; spot.setAttribute('aria-hidden', 'true');
		document.body.appendChild(spot);

		function reset(el) {
			if (!el) return;
			el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
		}
		function resetMag(el) { if (el) el.style.translate = ''; }

		function work() {
			raf = 0;
			if (!ev) return;
			var e = ev;
			spot.style.setProperty('--sx', e.clientX + 'px');
			spot.style.setProperty('--sy', e.clientY + 'px');
			spot.classList.add('is-on');

			var t = e.target && e.target.closest ? e.target : null;
			var card = t && t.closest(TILT);
			if (cur && cur !== card) reset(cur);
			if (card) {
				card.classList.add('fx-tilt');
				var r = card.getBoundingClientRect();
				var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
				card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
				card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
				// big cards tilt less so text stays easy to read
				var max = r.width > 520 ? 2.5 : 6;
				card.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
				card.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
			}
			cur = card;

			var m = t && t.closest(MAGNET);
			if (mag && mag !== m) resetMag(mag);
			if (m) {
				var b = m.getBoundingClientRect();
				var dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
				m.style.translate = (dx * 0.22).toFixed(1) + 'px ' + (dy * 0.3).toFixed(1) + 'px';
			}
			mag = m;
		}
		document.addEventListener('pointermove', function (e) {
			if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
			ev = e;
			if (!raf) raf = requestAnimationFrame(work);
		}, { passive: true });
		document.documentElement.addEventListener('mouseleave', function () {
			reset(cur); resetMag(mag); cur = mag = null; spot.classList.remove('is-on');
		});
	}

	// Click ripple on buttons — works on touch screens too.
	function initRipple() {
		document.addEventListener('pointerdown', function (e) {
			var el = e.target.closest && e.target.closest('.btn,.btn-link,.filter-btn');
			if (!el) return;
			var r = el.getBoundingClientRect();
			var size = Math.max(r.width, r.height) * 2;
			var s = document.createElement('span');
			s.className = 'fx-ripple';
			s.style.width = s.style.height = size + 'px';
			s.style.left = (e.clientX - r.left - size / 2) + 'px';
			s.style.top = (e.clientY - r.top - size / 2) + 'px';
			el.appendChild(s);
			setTimeout(function () { s.remove(); }, 650);
		}, { passive: true });
	}

	/* ------------------------------------------------------------------
	   3. Slowly drifting rail (homepage blog cards)
	   Auto-scrolls gently; stops the moment you touch, hover or focus, and
	   resumes a few seconds after you let go. You can always swipe/scroll it.
	   ------------------------------------------------------------------ */
	window.lpDriftRail = function (rail, opts) {
		if (!rail || rail.children.length < 3) return;
		rail.classList.add('is-rail');
		if (reduce) return;                       // plain swipeable row, no motion
		var speed = (opts && opts.speed) || 0.45; // px per 60fps frame ≈ 27px/s
		Array.prototype.slice.call(rail.children).forEach(function (c) {
			var k = c.cloneNode(true);
			k.setAttribute('aria-hidden', 'true');
			k.querySelectorAll('a,button').forEach(function (a) { a.tabIndex = -1; });
			rail.appendChild(k);
		});
		var pos = 0, half = 0, paused = false, inView = true, resumeAt = 0, last = 0, raf = 0, running = false;
		function measure() { half = rail.scrollWidth / 2; }
		function hold(ms) { paused = true; resumeAt = performance.now() + (ms || 2800); }
		function frame(now) {
			if (!running) return;
			var dt = Math.min(3, (now - last) / 16.7 || 1); last = now;
			if (paused && !rail.matches(':hover') && !rail.contains(document.activeElement) && now > resumeAt) { paused = false; pos = rail.scrollLeft; }
			if (!paused && half > 0) {
				pos += speed * dt;
				if (pos >= half) pos -= half;
				rail.scrollLeft = pos;
			}
			raf = requestAnimationFrame(frame);
		}
		function sync() {
			var go = inView && !document.hidden;
			if (go && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
			if (!go && running) { running = false; cancelAnimationFrame(raf); }
		}
		['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach(function (n) { rail.addEventListener(n, function () { hold(); }, { passive: true }); });
		rail.addEventListener('mouseenter', function () { hold(); });
		rail.addEventListener('scroll', function () {
			if (paused) {
				pos = rail.scrollLeft;
				if (half && rail.scrollLeft >= half) { rail.scrollLeft -= half; pos = rail.scrollLeft; }
			}
		}, { passive: true });
		window.addEventListener('resize', measure);
		if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }).observe(rail);
		document.addEventListener('visibilitychange', sync);
		measure(); window.addEventListener('load', measure);
		setTimeout(measure, 600);
		sync();
	};

	/* ---------------- boot ---------------- */
	function boot() {
		var header = document.getElementById('header');
		if (header && !reduce) initFlow(header);
		if (!reduce && finePointer) initPointerFx();
		if (!reduce) initRipple();
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
