/* Homepage dynamic content — stats strip, skills preview, blog teaser.
 * Extracted from an inline <script> so index.html's CSP can use a strict
 * script-src 'self' with no 'unsafe-inline'. Runs after js/site.js (for
 * escapeHTML, lpRevealItems, lpCountUp, lpRenderMedia, sortPostsByDateDesc). */

// ---------- Homepage dynamic content ----------

// Live stats strip, computed from the same data files as the Portfolio page.
Promise.all([
	fetch('data/projects.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ items: [] })),
	fetch('data/publications.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ items: [] })),
	fetch('data/experience.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ items: [] })),
	fetch('data/training.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ items: [] })),
	fetch('data/scholar-stats.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({}))
]).then(([projects, publications, experience, training, scholar]) => {
	const ongoing = (projects.items || []).filter(p => p.status === 'Ongoing').length;
	const stats = [
		{ number: (publications.items || []).length, label: 'Peer-Reviewed Publications' },
		{ number: (projects.items || []).length, label: 'Research Projects' },
		{ number: ongoing, label: 'Ongoing Projects' },
		{ number: (training.items || []).length, label: 'Trainings Delivered / Attended' }
	];
	// Citations come from data/scholar-stats.json, updated by hand from Google Scholar —
	// there's no free public API, so this card only appears once a real number is set.
	if (scholar.total_citations) {
		stats.push({ number: scholar.total_citations, label: 'Citations (Google Scholar)' });
	}
	const stripEl = document.getElementById('stats-strip');
	stripEl.innerHTML = stats.map(s => `
		<div class="stat-card">
			<div class="stat-number" data-count-target="${s.number}">0+</div>
			<div class="stat-label">${escapeHTML(s.label)}</div>
		</div>
	`).join('');
	lpRevealItems(stripEl, '.stat-card');
	lpCountUp(stripEl);
}).catch(err => console.error('Could not load stats', err));

// First two skill categories, shared with My Skills page via data/skills.json
fetch('data/skills.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => {
		// Skills & tools drifting right-to-left (CSS-only animation; pauses on hover/touch)
		const marquee = document.getElementById('home-skills-marquee');
		const toolChips = (data.tools || []).map(tool =>
			`<span class="marquee-chip"><i class="fa${tool.brand ? 'b' : 's'} ${escapeHTML(tool.icon || 'fa-check')}" aria-hidden="true"></i>${escapeHTML(tool.name)}</span>`);
		const skillChips = (data.categories || []).reduce((all, c) => all.concat(c.items || []), [])
			.map(item => `<span class="marquee-chip is-text">${escapeHTML(item)}</span>`);
		const makeRow = (chips, secondsPerChip) => {
			if (!chips.length) return '';
			const set = chips.join('');
			return `<div class="marquee"><div class="marquee-track" style="--dur:${Math.max(30, chips.length * secondsPerChip)}s">` +
				`<div class="marquee-set">${set}</div><div class="marquee-set" aria-hidden="true">${set}</div></div></div>`;
		};
		marquee.innerHTML = makeRow(toolChips, 4.5) + makeRow(skillChips, 3.2);

		const container = document.getElementById('home-skills-container');
		const categories = (data.categories || []).slice(0, 2);
		container.innerHTML = categories.map(cat => `
			<div class="skill-category">
				<h3><i class="fas ${escapeHTML(cat.icon || 'fa-check')}"></i> ${escapeHTML(cat.title)}</h3>
				<ul>${(cat.items || []).map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
			</div>
		`).join('');
		lpRevealItems(container, '.skill-category');
	})
	.catch(err => console.error('Could not load skills.json', err));

// Latest 3 blog posts, shared with the Blog page via data/blogs.json
fetch('data/blogs.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => {
		const container = document.getElementById('home-blog-teaser');
		const items = sortPostsByDateDesc(data.items || []).slice(0, 6);
		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No posts yet — check back soon.</p>';
			return;
		}
		container.innerHTML = items.map(post => {
			const href = post.link ? post.link : `blog-post.html?post=${encodeURIComponent(post.slug || '')}`;
			return `
				<div class="blog-teaser-card img-zoom">
					${lpRenderMedia(post.image || 'images/pic_05.jpg', post.title)}
					<div class="blog-teaser-body">
						<div class="blog-teaser-date">${escapeHTML(post.date)} &middot; ${escapeHTML(post.category || '')}</div>
						<h3 class="blog-teaser-title">${escapeHTML(post.title)}</h3>
						<p class="blog-teaser-excerpt">${escapeHTML(post.excerpt || '')}</p>
						<a class="blog-teaser-link" href="${href}">Read more &rarr;</a>
					</div>
				</div>
			`;
		}).join('');
		// Slowly drifting rail — gentle auto-scroll, pauses on touch/hover, swipeable.
		// (No scroll-reveal here: off-screen-to-the-side cards would never "enter".)
		lpDriftRail(container);
	})
	.catch(err => console.error('Could not load blogs.json', err));
