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
        document.documentElement.classList.remove('is-loading');
        document.body.setAttribute('aria-busy', 'false');
      }, 60);

      window.setTimeout(function () {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 400);
    }, remaining);
  }

  // Lets SPAs finish the screen themselves: window.NutraLoader.finish().
  window.NutraLoader = { finish: finish };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    finish();
  } else {
    document.addEventListener('DOMContentLoaded', finish, { once: true });
    window.addEventListener('load', finish, { once: true });
    window.setTimeout(finish, fallbackMs);
  }
}());
