/* Single blog-post page — loads the post named by ?post=slug from
 * data/blogs.json, sanitizes and renders its Markdown body, and wires
 * up the share links. Extracted from an inline <script> so
 * blog-post.html's CSP can use a strict script-src 'self'. Depends on
 * marked + DOMPurify (vendored in js/vendor/) and js/site.js. */

// ---------- Load the post named in the URL, e.g. blog-post.html?post=my-slug ----------
const params = new URLSearchParams(window.location.search);
const slug = params.get('post');
const pageUrl = 'https://lalitpathak.com.np/blog-post.html?post=' + encodeURIComponent(slug || '');

fetch('data/blogs.json')
	.then(res => res.json())
	.then(data => {
		const post = (data.items || []).find(item => item.slug === slug);
		const container = document.getElementById('post-container');

		if (!post) {
			document.getElementById('post-title').textContent = 'Post not found';
			container.innerHTML = '<p class="not-found">Sorry, this post could not be found. <a href="blogs.html">Back to Blog</a></p>';
			container.classList.add('is-loaded');
			return;
		}

		document.title = post.title + ' | Lalit Pathak - Environmental Scientist';
		document.getElementById('page-description-tag').setAttribute('content', post.excerpt || post.title);
		document.getElementById('og-title-tag').setAttribute('content', post.title);
		document.getElementById('post-title').textContent = post.title;
		document.getElementById('post-excerpt').textContent = post.excerpt || '';

		const heroImage = post.image
			? lpRenderMedia(post.image, post.title, 'blog-hero-image')
			: '';

		// Sanitize the rendered Markdown before it ever touches innerHTML. `marked`
		// happily passes raw <script>/<img onerror> through by design, so this is
		// the one line standing between a compromised CMS session (or a malicious
		// PR to data/blogs.json) and stored XSS on every visitor's browser.
		const rawHTML = post.body ? marked.parse(post.body) : '<p>' + escapeHTML(post.excerpt || '') + '</p>';
		const bodyHTML = DOMPurify.sanitize(rawHTML, {
			ADD_TAGS: ['video', 'source'],
			ADD_ATTR: ['controls', 'autoplay', 'loop', 'muted', 'playsinline', 'poster']
		});
		const wordCount = (post.body || post.excerpt || '').split(/\s+/).filter(Boolean).length;
		const readingMinutes = Math.max(1, Math.round(wordCount / 200));

		container.innerHTML = `
			${heroImage}
			<div class="blog-meta">
				<div class="blog-meta-left">
					<span>${escapeHTML(post.date)}</span>
					<span>&middot;</span>
					<span>${readingMinutes} min read</span>
				</div>
				<span class="blog-category">${escapeHTML(post.category || '')}</span>
			</div>
			<article class="blog-article">${bodyHTML}</article>
			<div class="post-footer">
				<a href="blogs.html" class="back-link"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to all posts</a>
				<div class="share-links">
					<a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter / X"><i class="fab fa-twitter"></i></a>
					<a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><i class="fab fa-linkedin-in"></i></a>
					<a href="mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(pageUrl)}" aria-label="Share by Email"><i class="fas fa-envelope"></i></a>
				</div>
			</div>
		`;
		container.classList.add('is-loaded');
		window.lpInitReadingProgress(document.querySelector('.blog-article'));
	})
	.catch(err => {
		console.error('Could not load post', err);
		document.getElementById('post-title').textContent = 'Could not load post';
	});
