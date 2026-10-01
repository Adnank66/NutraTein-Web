# Nutra Tein loading screen

This is a small, dependency-free loading screen. It preserves the Nutra Tein wording and colors. Its letters begin close together at the centre, then spread smoothly into their final positions with a short stagger—the same motion pattern as the supplied reference video—before the website softly fades and scales into place.

## Add it to your project

1. Copy `loader.css`, `loader.js`, and `nutra-tein-logo.svg` into your site's public/assets folder.
2. Add this inside your page's `<head>`:

```html
<link rel="stylesheet" href="/path/to/loader.css">
```

3. Change your opening body tag to this and paste the loader immediately below it:

```html
<body class="is-loading" aria-busy="true">
  <div class="nt-loader" role="status" aria-label="Loading Nutra Tein">
    <div class="nt-loader__content">
      <img class="nt-loader__brand" src="/path/to/nutra-tein-loader-logo.svg" alt="Nutra Tein">
      <div class="nt-loader__track" aria-hidden="true"><span class="nt-loader__progress"></span></div>
    </div>
  </div>
```

4. Add the script near the end of the body:

```html
<script src="/path/to/loader.js" defer></script>
```

It completes after the window `load` event and remains visible for at least **650 ms**. To change this for an individual page, add `data-minimum-visible-ms="900"` to the `nt-loader` tag; omit it to use 650 ms. The included preview uses 1250 ms only so the effect is easy to see. The 3-second safety fallback prevents the screen from getting stuck if an external asset fails to load.

For a single-page app, call `window.NutraLoader.finish()` when your app is ready instead of relying on the page-load event.

Open `index.html` to preview the included demo.
