/* Single publication page — publication.html?pub=slug. Reads the entry from
 * data/publications.json and shows citation details, abstract (Markdown,
 * sanitized), keywords and prev/next links. */

const pubSlug = new URLSearchParams(window.location.search).get('pub');

fetch('data/publications.json', { cache: 'no-cache' })
	.then(res => res.json())
	.then(data => {
		const items = data.items || [];
		const idx = items.findIndex(p => lpItemSlug(p) === pubSlug);
		const container = document.getElementById('detail-container');

		if (idx === -1) {
			document.getElementById('page-heading').textContent = 'Publication not found';
			container.innerHTML = '<p class="not-found">Sorry, this publication could not be found. <a href="publications.html">Back to all publications</a></p>';
			container.classList.add('is-loaded');
			return;
		}
		const pub = items[idx];
		const year = lpPubYear(pub);
		const link = lpSafeUrl(pub.link);
		const plain = (pub.abstract || '').replace(/[#*_`>\[\]()]/g, '').replace(/\s+/g, ' ').trim();

		document.title = pub.title + ' | Lalit Pathak - Environmental Scientist';
		document.getElementById('page-description-tag').setAttribute('content', (plain || pub.title).slice(0, 300));
		document.getElementById('og-title-tag').setAttribute('content', pub.title);
		document.getElementById('page-heading').textContent = pub.title;
		document.getElementById('page-sub').textContent = pub.authors || '';

		const keywords = (pub.keywords || '').split(/[,;]/).map(k => k.trim()).filter(Boolean)
			.map(k => `<a class="keyword-chip" href="publications.html?q=${encodeURIComponent(k)}"><i class="fas fa-tag" aria-hidden="true"></i> ${escapeHTML(k)}</a>`).join('');
		const prev = items[idx + 1], next = items[idx - 1]; // list is newest-first
		const pageUrl = 'https://lalitpathak.com.np/' + lpPubHref(pub);

		container.innerHTML = `
			<div class="detail-meta">
				${year ? `<span class="detail-tag">${escapeHTML(year)}</span>` : ''}
				<span>Journal article</span>
				${(pub.citations === null || pub.citations === undefined) ? '' : `<span>&middot; Cited by ${escapeHTML(pub.citations)}</span>`}
			</div>
			<p class="detail-authors">${escapeHTML(pub.authors)}</p>
			<p class="detail-journal">${escapeHTML(pub.journal)}</p>
			<div class="detail-actions">
				${link ? `<a class="btn-link" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Read full paper</a>` : ''}
				<a class="btn-link secondary" href="publications.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> All publications</a>
			</div>
			<h2>Abstract</h2>
			${pub.abstract
				? `<div class="abstract">${lpMarkdown(pub.abstract)}</div>`
				: `<p class="empty-state">The abstract for this publication hasn't been added yet.${link ? ` You can read it on the <a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">publisher's page</a>.` : ''}</p>`}
			${keywords ? `<h2>Keywords</h2><div class="scholar-stats-row">${keywords}</div>` : ''}
			<h2>Cite / share</h2>
			<p class="detail-authors" style="font-size:0.9rem">${escapeHTML(pageUrl)}</p>
			<nav class="detail-pager" aria-label="Other publications">
				${prev ? `<a class="prev" href="${escapeHTML(lpPubHref(prev))}">&larr; ${escapeHTML(prev.title)}</a>` : ''}
				${next ? `<a class="next" href="${escapeHTML(lpPubHref(next))}">${escapeHTML(next.title)} &rarr;</a>` : ''}
			</nav>`;
		container.classList.add('is-loaded');
	})
	.catch(err => {
		console.error('Could not load publication', err);
		document.getElementById('page-heading').textContent = 'Could not load publication';
	});
