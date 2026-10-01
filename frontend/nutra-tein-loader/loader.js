/* Nutra Tein preloader — include with `defer` after loader.css. */
(function () {
  'use strict';

  var loader = document.querySelector('.nt-loader');
  if (!loader) return;

  var startedAt = performance.now();
  // Set data-minimum-visible-ms on .nt-loader if a page needs a different time.
  var minimumVisibleMs = Number(loader.dataset.minimumVisibleMs) || 650;
  var fallbackMs = 3000;
  var done = false;

  function finish() {
    if (done) return;
    done = true;

    var remaining = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
    window.setTimeout(function () {
      loader.classList.add('is-exiting');

      // Let the logo zoom away first, then reveal the page beneath it.
      window.setTimeout(function () {
      loader.classList.add('is-complete');
      document.body.classList.remove('is-loading');
      document.body.setAttribute('aria-busy', 'false');
      }, 60);

      window.setTimeout(function () {
        loader.remove();
      }, 350);
    }, remaining);
  }

  // Lets SPAs finish the screen themselves: window.NutraLoader.finish().
  window.NutraLoader = { finish: finish };

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish, { once: true });
    window.setTimeout(finish, fallbackMs);
  }
}());
