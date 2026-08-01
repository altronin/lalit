// Contact form submission — real AJAX POST to Formspree with inline feedback.
(function () {
	const form = document.getElementById('contactForm');
	if (!form) return;

	const submitBtn = form.querySelector('button[type="submit"]');
	const originalText = submitBtn.textContent;

	let statusEl = document.getElementById('form-status');
	if (!statusEl) {
		statusEl = document.createElement('div');
		statusEl.id = 'form-status';
		statusEl.setAttribute('role', 'status');
		statusEl.style.marginTop = '1rem';
		statusEl.style.fontWeight = '600';
		form.appendChild(statusEl);
	}

	form.addEventListener('submit', function (e) {
		e.preventDefault();

		submitBtn.textContent = 'Sending...';
		submitBtn.disabled = true;
		statusEl.textContent = '';
		statusEl.style.color = '';

		const data = new FormData(form);

		fetch(form.action, {
			method: 'POST',
			body: data,
			headers: { 'Accept': 'application/json' }
		})
			.then(function (response) {
				if (response.ok) {
					statusEl.style.color = 'var(--primary-color, #2a6e3f)';
					statusEl.textContent = "Thanks — your message has been sent. I'll get back to you soon.";
					form.reset();
				} else {
					return response.json().then(function (payload) {
						const message = (payload && payload.errors && payload.errors.map(function (er) { return er.message; }).join(', '))
							|| 'Something went wrong. Please try again or email me directly.';
						throw new Error(message);
					});
				}
			})
			.catch(function (err) {
				statusEl.style.color = '#c0392b';
				statusEl.textContent = err.message || 'Something went wrong. Please try again or email me directly.';
			})
			.finally(function () {
				submitBtn.textContent = originalText;
				submitBtn.disabled = false;
			});
	});
})();
