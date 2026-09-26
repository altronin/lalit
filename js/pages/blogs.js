/* Blog listing page — image slider, filter/search, grid render, and the
 * publications teaser. Extracted from an inline <script> so blogs.html's
 * CSP can use a strict script-src 'self' with no 'unsafe-inline'. */

// ---------- Image slider ----------
const slider = document.getElementById('imageSlider');
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('sliderDots');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let currentSlide = 0;
const totalSlides = slides.length;

slides.forEach((_, index) => {
	const dot = document.createElement('div');
	dot.classList.add('dot');
	if (index === 0) dot.classList.add('active');
	dot.addEventListener('click', () => goToSlide(index));
	dotsContainer.appendChild(dot);
});

function updateSlider() {
	slider.style.transform = `translateX(-${currentSlide * 100}%)`;
	document.querySelectorAll('.dot').forEach((dot, index) => {
		dot.classList.toggle('active', index === currentSlide);
	});
	// Toggle .is-active so the current slide's image gets its slow Ken-Burns
	// zoom and its caption fades/slides in; other slides reset instantly.
	slides.forEach((slide, index) => slide.classList.toggle('is-active', index === currentSlide));
}
function goToSlide(slideIndex) { currentSlide = slideIndex; updateSlider(); }
function nextSlide() { currentSlide = (currentSlide + 1) % totalSlides; updateSlider(); }
function prevSlide() { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlider(); }

prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

let slideInterval = setInterval(nextSlide, 5000);
slider.parentElement.addEventListener('mouseenter', () => clearInterval(slideInterval));
slider.parentElement.addEventListener('mouseleave', () => { slideInterval = setInterval(nextSlide, 5000); });
updateSlider();

// ---------- Blog cards: rendered, searchable, and filterable by category ----------
const categoryIcons = {
	'Disaster Risk': 'fa-mountain',
	'Water Resources': 'fa-tint',
	'Climate Change': 'fa-leaf',
	'GIS & Remote Sensing': 'fa-map-marked-alt',
	'Research': 'fa-flask',
	'Review': 'fa-book-open',
	'Opinion': 'fa-comment-dots',
	'Stories & Essays': 'fa-feather'
};

let allPosts = [];
let activeCategory = 'all';

function postHref(item) {
	return (item.link && item.link.trim()) ? item.link : `blog-post.html?post=${encodeURIComponent(item.slug || '')}`;
}

function renderBlogGrid(query) {
	const container = document.getElementById('blog-grid');
	lpFadeSwap(container, () => {
		const q = (query || '').trim().toLowerCase();
		let items = allPosts;
		if (activeCategory !== 'all') items = items.filter(p => p.category === activeCategory);
		if (q) items = items.filter(p => (p.title + ' ' + (p.excerpt || '')).toLowerCase().includes(q));

		document.getElementById('blog-count').textContent = `${items.length} of ${allPosts.length} posts`;

		if (!items.length) {
			container.innerHTML = '<p class="empty-state">No posts match your filters.</p>';
			return;
		}
		container.innerHTML = items.map(item => `
			<article class="blog-card img-zoom">
				${lpRenderMedia(item.image || 'images/pic_05.jpg', item.title, 'blog-image')}
				<div class="blog-content">
					<div class="blog-meta">
						<span>${escapeHTML(item.date)}</span>
						<span class="blog-category">${escapeHTML(item.category || '')}</span>
					</div>
					<h3 class="blog-title">${escapeHTML(item.title)}</h3>
					<p class="blog-excerpt">${escapeHTML(item.excerpt)}</p>
					<a href="${escapeHTML(postHref(item))}" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
				</div>
			</article>
		`).join('');
		lpRevealItems(container, '.blog-card');
	});
}

function renderCategories() {
	const counts = {};
	allPosts.forEach(p => { const c = p.category || 'Uncategorized'; counts[c] = (counts[c] || 0) + 1; });
	const container = document.getElementById('categories-grid');
	const cards = Object.keys(counts).map(cat => `
		<div class="category-card${activeCategory === cat ? ' active' : ''}" data-category="${escapeHTML(cat)}">
			<div class="category-icon"><i class="fas ${categoryIcons[cat] || 'fa-tag'}"></i></div>
			<h3 class="category-name">${escapeHTML(cat)}</h3>
			<div class="category-count">${counts[cat]} Article${counts[cat] === 1 ? '' : 's'}</div>
		</div>
	`).join('');
	container.innerHTML = `
		<div class="category-card${activeCategory === 'all' ? ' active' : ''}" data-category="all">
			<div class="category-icon"><i class="fas fa-grip"></i></div>
			<h3 class="category-name">All Posts</h3>
			<div class="category-count">${allPosts.length} Articles</div>
		</div>
	` + cards;
	lpRevealItems(container, '.category-card');

	container.querySelectorAll('.category-card').forEach(card => {
		card.addEventListener('click', () => {
			activeCategory = card.dataset.category;
			renderCategories();
			renderBlogGrid(document.getElementById('blog-search').value);
			document.getElementById('blog-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
}

fetch('data/blogs.json')
	.then(res => res.json())
	.then(data => {
		allPosts = sortPostsByDateDesc(data.items || []);
		renderBlogGrid('');
		renderCategories();
	})
	.catch(err => console.error('Could not load blogs.json', err));

document.getElementById('blog-search').addEventListener('input', e => renderBlogGrid(e.target.value));

// ---------- Featured publications, pulled from the same source as the Portfolio page ----------
fetch('data/publications.json')
	.then(res => res.json())
	.then(data => {
		const items = (data.items || []).slice(0, 2);
		const featuredGrid = document.getElementById('featured-grid');
		featuredGrid.innerHTML = items.map(item => `
			<div class="featured-card">
				<h3>${escapeHTML(item.title)}</h3>
				<p>${escapeHTML(item.journal)}</p>
				<a href="${escapeHTML(item.link)}" class="blog-read-more" target="_blank" rel="noopener noreferrer">View Publication <i class="fas fa-arrow-right"></i></a>
			</div>
		`).join('');
		lpRevealItems(featuredGrid, '.featured-card');
	})
	.catch(err => console.error('Could not load publications.json', err));
