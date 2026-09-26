/* Portfolio page — experience timeline, project grid + filters,
 * publications reference list + search, Google Scholar badges, and
 * training cards, all rendered from /data/*.json. Extracted from an
 * inline <script> so portfolio.html's CSP can use a strict
 * script-src 'self' with no 'unsafe-inline'. */

// ---------- Content rendered from /data JSON files ----------

// Professional Experience
fetch('data/experience.json')
	.then(res => res.json())
	.then(data => {
		const items = data.items;
		const container = document.getElementById('experience-timeline');
		container.innerHTML = items.map(item => `
			<div class="experience-item">
				<div class="experience-date">
					<span class="experience-year">${escapeHTML(item.date_range)}</span>
				</div>
				<div class="experience-content">
					<div class="experience-role">${escapeHTML(item.role)}</div>
					<div class="experience-organization">${escapeHTML(item.organization)}</div>
					<p>${escapeHTML(item.description)}</p>
				</div>
			</div>
		`).join('');
		lpRevealItems(container, '.experience-item');
	})
	.catch(err => console.error('Could not load experience.json', err));

// Projects (with status filter)
let allProjects = [];
function renderProjects(filter) {
	const container = document.getElementById('project-grid');
	lpFadeSwap(container, () => {
		const items = filter === 'all' ? allProjects : allProjects.filter(p => p.status === filter);
		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No projects match this filter.</p>';
			return;
		}
		container.innerHTML = items.map(item => {
			const statusClass = item.status === 'Completed' ? 'status-completed' : 'status-ongoing';
			const responsibilities = (item.responsibilities || []).map(r => `<li>${escapeHTML(r)}</li>`).join('');
			return `
				<div class="project-card">
					<div class="project-header">
						<h3 class="project-title">${escapeHTML(item.title)}</h3>
						<div class="project-meta">
							<span>${escapeHTML(item.date_range)}</span>
							<span class="project-status ${statusClass}">${escapeHTML(item.status)}</span>
						</div>
					</div>
					<div class="project-body">
						<div class="project-role">${escapeHTML(item.role)}</div>
						<p class="project-description">${escapeHTML(item.description)}</p>
						<div class="project-responsibilities">
							<h4>Responsibilities:</h4>
							<ul>${responsibilities}</ul>
						</div>
					</div>
				</div>
			`;
		}).join('');
		lpRevealItems(container, '.project-card');
	});
}
fetch('data/projects.json')
	.then(res => res.json())
	.then(data => {
		allProjects = data.items || [];
		document.getElementById('project-count').textContent = `${allProjects.length} total`;
		renderProjects('all');
	})
	.catch(err => console.error('Could not load projects.json', err));

document.getElementById('project-filters').addEventListener('click', function (e) {
	const btn = e.target.closest('.filter-btn');
	if (!btn) return;
	document.querySelectorAll('#project-filters .filter-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	renderProjects(btn.dataset.filter);
});

// Publications (with live search)
let allPublications = [];
function renderPublications(query) {
	const container = document.getElementById('publication-list');
	lpFadeSwap(container, () => {
		const q = (query || '').trim().toLowerCase();
		const items = !q ? allPublications : allPublications.filter(p =>
			(p.title + ' ' + p.authors + ' ' + p.journal).toLowerCase().includes(q)
		);
		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No publications match your search.</p>';
			return;
		}
		container.innerHTML = items.map(item => {
			const citations = (item.citations === null || item.citations === undefined) ? ''
				: `<span class="publication-citations"><i class="fas fa-quote-right" aria-hidden="true"></i> Cited by ${escapeHTML(item.citations)}</span>`;
			return `
			<p class="publication-item">
				<span class="publication-authors">${escapeHTML(item.authors)}</span>
				&mdash; <span class="publication-title">${escapeHTML(item.title)}.</span>
				<span class="publication-journal">${escapeHTML(item.journal)}.</span>
				<br>
				<a href="${escapeHTML(item.link)}" class="publication-link" target="_blank" rel="noopener noreferrer">View publication &rarr;</a>
				${citations}
			</p>
		`;
		}).join('');
		lpRevealItems(container, '.publication-item');
	});
}
fetch('data/publications.json')
	.then(res => res.json())
	.then(data => {
		allPublications = data.items || [];
		document.getElementById('publication-count').textContent = `${allPublications.length} total`;
		renderPublications('');
	})
	.catch(err => console.error('Could not load publications.json', err));

document.getElementById('publication-search').addEventListener('input', function (e) {
	renderPublications(e.target.value);
});

// Google Scholar summary (there's no free public Scholar API — these numbers
// are entered by hand in data/scholar-stats.json whenever they're checked).
fetch('data/scholar-stats.json')
	.then(res => res.json())
	.then(stats => {
		const row = document.getElementById('scholar-stats-row');
		const badges = [];
		if (stats.total_citations) badges.push(`<span class="scholar-badge"><i class="fas fa-quote-right" aria-hidden="true"></i> ${escapeHTML(stats.total_citations)} Citations</span>`);
		if (stats.h_index) badges.push(`<span class="scholar-badge"><i class="fas fa-chart-line" aria-hidden="true"></i> h-index ${escapeHTML(stats.h_index)}</span>`);
		if (stats.i10_index) badges.push(`<span class="scholar-badge"><i class="fas fa-layer-group" aria-hidden="true"></i> i10-index ${escapeHTML(stats.i10_index)}</span>`);
		badges.push(`<a class="scholar-badge" href="${escapeHTML(stats.profile_url)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-graduation-cap" aria-hidden="true"></i> Full Google Scholar Profile</a>`);
		row.innerHTML = badges.join('');
		lpRevealItems(row, '.scholar-badge');
	})
	.catch(err => console.error('Could not load scholar-stats.json', err));

// Training & Professional Development
fetch('data/training.json')
	.then(res => res.json())
	.then(data => {
		const items = data.items;
		const container = document.getElementById('training-grid');
		container.innerHTML = items.map(item => `
			<div class="training-card">
				<div class="training-title">${escapeHTML(item.title)}</div>
				<div class="training-meta">${escapeHTML(item.date_range)}</div>
				<div class="training-organization">${escapeHTML(item.organization)}</div>
			</div>
		`).join('');
		lpRevealItems(container, '.training-card');
	})
	.catch(err => console.error('Could not load training.json', err));
