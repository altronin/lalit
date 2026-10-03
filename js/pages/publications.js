/* Publications listing page — every entry in data/publications.json,
 * newest first, with year filter + search. Each title opens its own
 * detail page (publication.html?pub=slug) showing the abstract. */

let allPublications = [];
let activeYear = 'all';

function pubSearchText(p) {
	return [p.title, p.authors, p.journal, p.keywords].join(' ').toLowerCase();
}

function renderPublications() {
	const container = document.getElementById('publication-list');
	const q = document.getElementById('publication-search').value.trim().toLowerCase();
	lpFadeSwap(container, () => {
		let items = allPublications;
		if (activeYear !== 'all') items = items.filter(p => lpPubYear(p) === activeYear);
		if (q) items = items.filter(p => pubSearchText(p).includes(q));
		document.getElementById('publication-count').textContent = `${items.length} of ${allPublications.length} publications`;
		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No publications match your filters.</p>';
			return;
		}
		container.innerHTML = items.map(pubItemHTML).join('');
		lpRevealItems(container, '.publication-item');
	});
}

function renderYearFilters() {
	const years = [...new Set(allPublications.map(lpPubYear).filter(Boolean))].sort((a, b) => b - a);
	const bar = document.getElementById('publication-filters');
	bar.innerHTML = ['all', ...years].map(y =>
		`<button class="filter-btn${y === activeYear ? ' active' : ''}" data-year="${y}">${y === 'all' ? 'All years' : y}</button>`
	).join('');
}

document.getElementById('publication-filters').addEventListener('click', e => {
	const btn = e.target.closest('.filter-btn');
	if (!btn) return;
	activeYear = btn.dataset.year;
	renderYearFilters();
	renderPublications();
});
document.getElementById('publication-search').addEventListener('input', renderPublications);

fetch('data/publications.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => {
		// Keep CMS order within a year; sort years newest-first (stable sort).
		allPublications = [...(data.items || [])].sort((a, b) => (lpPubYear(b) || 0) - (lpPubYear(a) || 0));
		const q0 = new URLSearchParams(window.location.search).get('q');
		if (q0) document.getElementById('publication-search').value = q0;
		renderYearFilters();
		renderPublications();
	})
	.catch(err => {
		console.error('Could not load publications.json', err);
		document.getElementById('publication-list').innerHTML = '<p class="empty-state">Could not load publications.</p>';
	});

fetch('data/scholar-stats.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(stats => {
		const row = document.getElementById('scholar-stats-row');
		const badges = [];
		if (stats.total_citations) badges.push(`<span class="scholar-badge"><i class="fas fa-quote-right" aria-hidden="true"></i> ${escapeHTML(stats.total_citations)} Citations</span>`);
		if (stats.h_index) badges.push(`<span class="scholar-badge"><i class="fas fa-chart-line" aria-hidden="true"></i> h-index ${escapeHTML(stats.h_index)}</span>`);
		if (stats.i10_index) badges.push(`<span class="scholar-badge"><i class="fas fa-layer-group" aria-hidden="true"></i> i10-index ${escapeHTML(stats.i10_index)}</span>`);
		const url = lpSafeUrl(stats.profile_url);
		if (url) badges.push(`<a class="scholar-badge" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-graduation-cap" aria-hidden="true"></i> Full Google Scholar Profile</a>`);
		row.innerHTML = badges.join('');
	})
	.catch(() => {});
