/* Single project page — project.html?project=slug. Reads the entry from
 * data/projects.json and shows status, role, overview (Markdown,
 * sanitized), responsibilities and prev/next links. */

const projectSlug = new URLSearchParams(window.location.search).get('project');

fetch('data/projects.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => {
		const items = data.items || [];
		const idx = items.findIndex(p => lpItemSlug(p) === projectSlug);
		const container = document.getElementById('detail-container');

		if (idx === -1) {
			document.getElementById('page-heading').textContent = 'Project not found';
			container.innerHTML = '<p class="not-found">Sorry, this project could not be found. <a href="projects.html">Back to all projects</a></p>';
			container.classList.add('is-loaded');
			return;
		}
		const p = items[idx];
		const statusClass = p.status === 'Completed' ? 'status-completed' : 'status-ongoing';
		const link = lpSafeUrl(p.link);
		const resp = (p.responsibilities || []).map(r => `<li>${escapeHTML(r)}</li>`).join('');
		const prev = items[idx + 1], next = items[idx - 1];

		document.title = p.title + ' | Lalit Pathak - Environmental Scientist';
		document.getElementById('page-description-tag').setAttribute('content', p.description || p.title);
		document.getElementById('og-title-tag').setAttribute('content', p.title);
		document.getElementById('page-heading').textContent = p.title;
		document.getElementById('page-sub').textContent = p.description || '';

		container.innerHTML = `
			${p.image ? lpRenderMedia(p.image, p.title, 'detail-hero') : ''}
			<div class="detail-meta">
				<span class="project-status ${statusClass}">${escapeHTML(p.status)}</span>
				<span>${escapeHTML(p.date_range)}</span>
				<span>&middot; ${escapeHTML(p.role)}</span>
			</div>
			${p.body ? `<h2>Overview</h2><div class="abstract">${lpMarkdown(p.body)}</div>` : `<h2>Summary</h2><p>${escapeHTML(p.description)}</p>`}
			${resp ? `<h2>Responsibilities</h2><ul>${resp}</ul>` : ''}
			<div class="detail-actions">
				${link ? `<a class="btn-link" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Project link</a>` : ''}
				<a class="btn-link secondary" href="projects.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> All projects</a>
			</div>
			<nav class="detail-pager" aria-label="Other projects">
				${prev ? `<a class="prev" href="${escapeHTML(lpProjectHref(prev))}">&larr; ${escapeHTML(prev.title)}</a>` : ''}
				${next ? `<a class="next" href="${escapeHTML(lpProjectHref(next))}">${escapeHTML(next.title)} &rarr;</a>` : ''}
			</nav>`;
		container.classList.add('is-loaded');
	})
	.catch(err => {
		console.error('Could not load project', err);
		document.getElementById('page-heading').textContent = 'Could not load project';
	});
