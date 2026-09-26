/* My Skills page — renders skill categories, tools, and certifications
 * from data/skills.json & data/training.json. Extracted from an inline
 * <script> so myskills.html's CSP can use a strict script-src 'self'.
 */

fetch('data/skills.json')
	.then(res => res.json())
	.then(data => {
		// Core competencies
		const skillsContainer = document.getElementById('skills-container');
		skillsContainer.innerHTML = (data.categories || []).map(cat => `
			<div class="skill-category">
				<h3><i class="fas ${escapeHTML(cat.icon || 'fa-check')}"></i> ${escapeHTML(cat.title)}</h3>
				<ul>${(cat.items || []).map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
			</div>
		`).join('');
		lpRevealItems(skillsContainer, '.skill-category');

		// Skill proficiency bars
		const progressContainer = document.getElementById('progress-container');
		const progressHTML = (data.proficiency || []).map(p => `
			<div class="progress-item">
				<div class="progress-header">
					<span class="progress-label">${escapeHTML(p.label)}</span>
					<span class="progress-value">${escapeHTML(p.value)}%</span>
				</div>
				<div class="progress-bar">
					<div class="progress-fill" data-width="${escapeHTML(p.value)}%"></div>
				</div>
			</div>
		`).join('');
		progressContainer.innerHTML = progressHTML;

		// Fill each bar only once it scrolls into view, so the viewer
		// actually sees the 0 -> value animation instead of it firing
		// off-screen while the page first loads.
		if ('IntersectionObserver' in window) {
			const barIO = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (!entry.isIntersecting) return;
					entry.target.style.width = entry.target.dataset.width;
					barIO.unobserve(entry.target);
				});
			}, { threshold: 0.4 });
			document.querySelectorAll('.progress-fill').forEach(bar => barIO.observe(bar));
		} else {
			document.querySelectorAll('.progress-fill').forEach(bar => { bar.style.width = bar.dataset.width; });
		}

		// Tools & technologies
		const toolsGrid = document.getElementById('tools-grid');
		toolsGrid.innerHTML = (data.tools || []).map(tool => `
			<div class="tool-item">
				<div class="tool-icon"><i class="fa${tool.brand ? 'b' : 's'} ${escapeHTML(tool.icon || 'fa-check')}"></i></div>
				<div class="tool-name">${escapeHTML(tool.name)}</div>
			</div>
		`).join('');
		lpRevealItems(toolsGrid, '.tool-item');

		// Languages
		const languagesContainer = document.getElementById('languages-container');
		languagesContainer.innerHTML = (data.languages || []).map(lang => `
			<div class="language-item">
				<div class="language-name">${escapeHTML(lang.name)}</div>
				<div class="language-level">${escapeHTML(lang.level)}</div>
			</div>
		`).join('');
		lpRevealItems(languagesContainer, '.language-item');
	})
	.catch(err => console.error('Could not load skills.json', err));

// Selected certifications, pulled from the same Training data used on the Portfolio page
fetch('data/training.json')
	.then(res => res.json())
	.then(data => {
		const items = (data.items || []).slice(0, 3);
		const certList = document.getElementById('certifications-list');
		certList.innerHTML = items.map(item => `
			<div class="certification-item">
				<div>
					<div class="certification-title">${escapeHTML(item.title)}</div>
					<div class="certification-org">${escapeHTML(item.organization)}</div>
				</div>
				<div class="certification-date">${escapeHTML(item.date_range)}</div>
			</div>
		`).join('');
		lpRevealItems(certList, '.certification-item');
	})
	.catch(err => console.error('Could not load training.json', err));
