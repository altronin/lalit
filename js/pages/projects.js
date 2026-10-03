/* Projects listing page — every entry in data/projects.json with status
 * filter + search. Each card opens project.html?project=slug. */

let allProjects = [];
let activeStatus = 'all';

function renderProjects() {
	const container = document.getElementById('project-grid');
	const q = document.getElementById('project-search').value.trim().toLowerCase();
	lpFadeSwap(container, () => {
		let items = allProjects;
		if (activeStatus !== 'all') items = items.filter(p => p.status === activeStatus);
		if (q) items = items.filter(p => [p.title, p.role, p.description].join(' ').toLowerCase().includes(q));
		document.getElementById('project-count').textContent = `${items.length} of ${allProjects.length} projects`;
		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No projects match your filters.</p>';
			return;
		}
		container.innerHTML = items.map(item => {
			const statusClass = item.status === 'Completed' ? 'status-completed' : 'status-ongoing';
			return `
				<div class="project-card">
					<div class="project-header">
						<h3 class="project-title"><a href="${escapeHTML(lpProjectHref(item))}">${escapeHTML(item.title)}</a></h3>
						<div class="project-meta">
							<span>${escapeHTML(item.date_range)}</span>
							<span class="project-status ${statusClass}">${escapeHTML(item.status)}</span>
						</div>
					</div>
					<div class="project-body">
						<div class="project-role">${escapeHTML(item.role)}</div>
						<p class="project-description">${escapeHTML(item.description)}</p>
						<a class="card-more" href="${escapeHTML(lpProjectHref(item))}">View project details &rarr;</a>
					</div>
				</div>`;
		}).join('');
		lpRevealItems(container, '.project-card');
	});
}

document.getElementById('project-filters').addEventListener('click', e => {
	const btn = e.target.closest('.filter-btn');
	if (!btn) return;
	document.querySelectorAll('#project-filters .filter-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	activeStatus = btn.dataset.filter;
	renderProjects();
});
document.getElementById('project-search').addEventListener('input', renderProjects);

fetch('data/projects.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => { allProjects = data.items || []; renderProjects(); })
	.catch(err => {
		console.error('Could not load projects.json', err);
		document.getElementById('project-grid').innerHTML = '<p class="empty-state">Could not load projects.</p>';
	});
