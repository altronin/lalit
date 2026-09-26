/* Runs before first paint (loaded, unminified but tiny, in <head>) to apply a
 * saved dark-mode preference immediately and avoid a flash of the light theme.
 * Kept as its own file (not inline) so every page's Content-Security-Policy
 * can use a strict `script-src 'self'` with no 'unsafe-inline'. */
(function () {
	try {
		if (localStorage.getItem('lp-theme') === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark');
		}
	} catch (e) { /* localStorage unavailable (privacy mode, etc.) — default theme is fine */ }
})();
