/**
 * PROTEINX — Animations & Video System Engine
 * Scroll Reveals, Number Counters, Video Lazy Loading & Auto-Pause, Micro-Interactions
 */

(function () {
  'use strict';

  // Check accessibility preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================================
  // 1. SCROLL-TRIGGERED REVEAL OBSERVER
  // ==========================================================================
  function initScrollReveals() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-init, .reveal-on-scroll').forEach(el => {
        el.classList.add('reveal-visible');
      });
      return;
    }

    const revealElements = document.querySelectorAll(
      '.reveal-init, .reveal-on-scroll, .reveal-fade, .reveal-slide-up, .reveal-slide-down, .reveal-slide-left, .reveal-slide-right, .reveal-zoom-in'
    );

    revealElements.forEach(el => {
      if (!el.classList.contains('reveal-init')) {
        el.classList.add('reveal-init');
      }
      if (!el.classList.contains('reveal-slide-up') &&
          !el.classList.contains('reveal-fade') &&
          !el.classList.contains('reveal-slide-left') &&
          !el.classList.contains('reveal-slide-right') &&
          !el.classList.contains('reveal-zoom-in')) {
        el.classList.add('reveal-slide-up');
      }
    });

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('reveal-visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.12
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ==========================================================================
  // 2. ANIMATED STATISTICS & NUMBER COUNTER ENGINE
  // ==========================================================================
  function initNumberCounters() {
    const counterElements = document.querySelectorAll('[data-counter]');
    if (!counterElements.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counterElements.forEach(el => {
        const target = parseFloat(el.getAttribute('data-counter')) || 0;
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString('en-IN')) + suffix;
      });
      return;
    }

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-counter')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const duration = 1800; // ms
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = target * easeProgress;

      const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('en-IN');
      el.textContent = prefix + formatted + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        const finalFormatted = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString('en-IN');
        el.textContent = prefix + finalFormatted + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // ==========================================================================
  // 3. CINEMATIC HERO VIDEO CONTROLS & AUTO-PAUSE
  // ==========================================================================
  let isHeroMuted = true;

  function initHeroVideo() {
    const heroVideo = document.querySelector('.hero-video-bg');
    if (!heroVideo) return;

    // Check Data Saver / slow connection
    if (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType === '2g')) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.style.display = 'none';
      return;
    }

    // Auto pause hero video when scrolled out of view (saves battery/GPU)
    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (heroVideo.paused) heroVideo.play().catch(() => {});
          } else {
            if (!heroVideo.paused) heroVideo.pause();
          }
        });
      }, { threshold: 0.1 });

      const heroSlider = document.getElementById('main-hero-slider') || heroVideo.parentElement;
      if (heroSlider) heroObserver.observe(heroSlider);
    }

    // Bind Sound / Play buttons if present
    const muteBtn = document.getElementById('hero-mute-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        isHeroMuted = !isHeroMuted;
        heroVideo.muted = isHeroMuted;
        updateHeroSoundUI(isHeroMuted);
      });
    }

    const playBtn = document.getElementById('hero-play-toggle-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (heroVideo.paused) {
          heroVideo.play().catch(() => {});
          updateHeroPlayUI(true);
        } else {
          heroVideo.pause();
          updateHeroPlayUI(false);
        }
      });
    }
  }

  function updateHeroSoundUI(muted) {
    const btn = document.getElementById('hero-mute-toggle-btn');
    if (!btn) return;
    if (muted) {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg><span>Unmute</span>`;
    } else {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span>Mute</span>`;
    }
  }

  function updateHeroPlayUI(playing) {
    const btn = document.getElementById('hero-play-toggle-btn');
    if (!btn) return;
    if (playing) {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Pause</span>`;
    } else {
      btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Play</span>`;
    }
  }

  // ==========================================================================
  // 3B. 3D SPINNING PROTEIN TUB SHOWCASE ENGINE
  // ==========================================================================
  window.handleTubVideoLoaded = function (video) {
    if (!video) return;
    video.style.opacity = '1';
    const fallback = document.getElementById('tub-fallback-image');
    if (fallback) fallback.style.display = 'none';
  };

  window.handleTubVideoError = function (video) {
    console.warn('[PROTEINX] Spinning tub video load event fallback activated');
    if (!video) return;
    video.style.display = 'none';
    const fallback = document.getElementById('tub-fallback-image');
    if (fallback) fallback.style.display = 'block';
  };

  window.toggleTubSpinningPlayback = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const video = document.getElementById('hero-spinning-tub-video');
    const icon = document.getElementById('tub-spin-icon');
    const text = document.getElementById('tub-spin-text');
    if (!video) return;

    if (video.paused) {
      delete video.dataset.userPaused;
      video.play().then(() => {
        if (icon) icon.textContent = '⏸';
        if (text) text.textContent = 'Pause Rotation';
      }).catch(() => {});
    } else {
      video.dataset.userPaused = 'true';
      video.pause();
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = 'Resume Rotation';
    }
  };

  function initTubShowcaseVideo() {
    const video = document.getElementById('hero-spinning-tub-video');
    if (!video) return;

    // Respect reduced motion accessibility
    if (prefersReducedMotion) {
      video.pause();
      const icon = document.getElementById('tub-spin-icon');
      const text = document.getElementById('tub-spin-text');
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = 'Resume Rotation';
      return;
    }

    // Auto-pause when scrolled offscreen to conserve CPU/GPU
    if ('IntersectionObserver' in window) {
      const tubObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (video.paused && !video.dataset.userPaused) {
              video.play().catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      }, { threshold: 0.15 });

      const container = document.getElementById('hero-tub-showcase-container') || video;
      tubObserver.observe(container);
    }

    // Attempt autoplay muted smoothly
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, keep fallback poster visible
        console.log('[PROTEINX] Autoplay deferred until user interaction');
      });
    }

    // Sync with backend API if updated by admin
    syncShowcaseWithApi();
  }

  async function syncShowcaseWithApi() {
    try {
      const res = await fetch('/api/videos');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && data.productShowcaseVideo) {
        const conf = data.productShowcaseVideo;
        const video = document.getElementById('hero-spinning-tub-video');
        const badgeTitle = document.querySelector('.tub-floating-badge.badge-top-left .badge-title');
        
        if (badgeTitle && conf.badgeText) {
          badgeTitle.textContent = conf.badgeText;
        }

        if (video && conf.videoUrl && video.getAttribute('src') !== conf.videoUrl) {
          video.src = conf.videoUrl;
          if (conf.posterUrl) video.poster = conf.posterUrl;
          video.load();
          video.play().catch(() => {});
        }
      }
    } catch (e) {
      // Graceful ignore
    }
  }

  // ==========================================================================
  // 4. FITNESS VIDEO SHOWCASE INTERACTIVE PLAYER
  // ==========================================================================
  window.toggleFitnessCardPlayback = function (cardElement) {
    const video = cardElement.querySelector('video');
    const playOverlay = cardElement.querySelector('.fitness-play-overlay');
    if (!video) return;

    if (video.paused) {
      // Pause all other fitness showcase videos first
      document.querySelectorAll('.fitness-video-player-wrap video').forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
          const ov = v.closest('.fitness-video-player-wrap')?.querySelector('.fitness-play-overlay');
          if (ov) ov.style.opacity = '1';
        }
      });

      video.play().then(() => {
        if (playOverlay) playOverlay.style.opacity = '0';
      }).catch(e => console.log('Playback error:', e));
    } else {
      video.pause();
      if (playOverlay) playOverlay.style.opacity = '1';
    }
  };

  // Video Lazy Loading with IntersectionObserver
  function initVideoLazyLoading() {
    const lazyVideos = document.querySelectorAll('video[data-src]');
    if (!lazyVideos.length) return;

    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target;
            const src = video.getAttribute('data-src');
            if (src) {
              video.src = src;
              video.removeAttribute('data-src');
              video.load();
            }
            observer.unobserve(video);
          }
        });
      }, { rootMargin: '300px' });

      lazyVideos.forEach(v => videoObserver.observe(v));
    } else {
      lazyVideos.forEach(v => {
        v.src = v.getAttribute('data-src');
      });
    }
  }

  // ==========================================================================
  // 5. MICRO-INTERACTIONS API (Exported Globally)
  // ==========================================================================
  window.triggerCartBounce = function () {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.classList.remove('cart-badge-celebrate');
      // Trigger reflow to restart CSS animation
      void b.offsetWidth;
      b.classList.add('cart-badge-celebrate');
      setTimeout(() => b.classList.remove('cart-badge-celebrate'), 700);
    });
  };

  window.triggerWishlistPop = function (buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.remove('heart-pop-active');
    void buttonElement.offsetWidth;
    buttonElement.classList.add('heart-pop-active');
    setTimeout(() => buttonElement.classList.remove('heart-pop-active'), 600);
  };

  // ==========================================================================
  // 6. INITIALIZATION HOOK
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initNumberCounters();
    initHeroVideo();
    initTubShowcaseVideo();
    initVideoLazyLoading();
  });

  // Re-run reveals when dynamic content is inserted
  window.refreshScrollAnimations = function () {
    initScrollReveals();
    initNumberCounters();
    initTubShowcaseVideo();
    initVideoLazyLoading();
  };

})();
