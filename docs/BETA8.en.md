# beta.8: persistent terrain and site printing

The homepage heading still reads `home.title`. The independent wordmark reads the site's `title` in `_config.yml`. The print target is the masthead photograph, configured `home.masthead.artwork.image`, `site_logo`, or the site wordmark, in that order. Disabling `show_cover` selects the wordmark; disabling artwork removes the decorative object.

`appearance.contour` retains `enable`, `style`, `opacity`, and `scope`. Terrain stays in a fixed shell outside page navigation: two corners on desktop and one on mobile. Reading surfaces protect text and code. There is no scroll animation or new particle configuration.

The existing entrance lasts about 2400ms, including the pause at 60%, yellow sweep, and fade. The subsequent 1600ms print passes through incident rays, deposition, residue, and a stable result. Photographs keep their base image. Decorative reveals are prepared only while the entrance fully conceals them; late resources remain static.

Reduced motion, data saving, disabled motion, history restoration, skipped entrances, and resource failures retain static content. Without JavaScript, the image or wordmark remains readable. Font, viewport, image candidate, and theme changes end an active print. User SVG files remain images and are never injected as DOM markup.

Verification includes controlled-clock frames, real-time recordings, 30 navigations, image geometry and canvas budgets, the full suite, runtime compatibility, installation outside the repository, and the public showcase. Evidence is written to `.local/beta8` and `.local/verification`.

[Live showcase](https://drtxdt.github.io/Hypergraph/) · [Building and publishing](https://github.com/Drtxdt/Hypergraph/blob/main/demo/README.md)
