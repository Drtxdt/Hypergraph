# beta.8 implementation record

Baseline: cf0d1fc (2.1.0-beta.7). Status: implementation and local acceptance complete; publication uses the gated main workflow.

## Locked decisions

- Preserve the existing 2400ms entrance, including its 60% hold. Start the 840ms local print only after the entrance ends.
- Keep the homepage heading and description; use configured artwork, site logo, or the actual site title as the independent visual identity. Remove the default folded planes.
- Fixed upper-right/lower-left terrain on desktop, one corner on mobile. No parallax.
- Stable environmental shell outside Swup; background, terrain, paper, content and print have separate layers.
- No compatibility branch for old decorative behavior. Do not modify the personal blog or Drtxdt.github.io.
- Publish only this repository's public demo with GitHub Pages, using the exact verified package.

## Delivery sequence

1. Static no-image homepage, photographic homepage, article third screen and mobile homepage; light/dark/background combinations.
2. Persistent shell, stitched/smoothed terrain, cropped corner and chapter assets, page-state synchronization.
3. Entry lifecycle, shared object-fit/object-position geometry, wordmark sampling, directional print and static fallbacks.
4. Deterministic frames and real-time recordings, full checks, package consumer test, Pages deployment and live smoke test.

## Acceptance

- Print is fully visible after entrance, stops after completion, never re-hides already exposed media. Photos retain their stable base.
- Wide/tall transparent artwork remains aligned at center/corners and independent mobile positions.
- Terrain persists through long reading; paper protects text/code/TOC. Thirty navigations do not accumulate layers or listeners.
- Cover intro off/on, delayed module/image, failed/cross-origin media, history, anchors, skip, background, reduced motion, save-data and no JS.
- Capture fixed 0/25/50/75/100% frames with Playwright clock; replace fixed 2700ms waits with terminal-state checks.
- Retain readable/LCP <=2500ms, CLS <=0.1, interaction <=200ms, canvas <=1500000 pixels, DPR <=2, target points <=900 mobile/1800 desktop.
- Publish default, photography and custom-mark public examples under the Pages base path; verify links, search, resources and deployed commit.

## Implementation and evidence

- Replaced the abstract builtin artwork with the actual site wordmark, with custom artwork/logo precedence and measured multiline glyph sampling.
- Moved terrain and user background into one persistent shell; page attributes update their visibility after Swup replacement. Home-only backgrounds are not fetched on article entries.
- Joined marching-squares segments, simplified/smoothed paths, and generated upper/lower/mobile/chapter crops. Total contour gzip budget: 28,138 bytes (limit 30,720).
- Added one 840ms print lifecycle after the unchanged entrance; resource preparation runs during the entrance. Shared object geometry covers contain/cover, percentage/pixel/edge positions. Cancellation destroys the canvas and listeners.
- Added deterministic 0/25/50/75/100% captures, wide/tall image alignment checks, long and mixed-language wordmarks, static fallbacks, real-time recordings, and 30-navigation shell identity checks.
- Added the public package-based showcase and gated Pages jobs. Pages source is now `workflow`; actual URL returned by GitHub: https://drtxdt.github.io/Hypergraph/.
- Kept the personal blog and Drtxdt.github.io outside the work.

## Validation log

Initial beta.8 browser matrix passed all 12 desktop/mobile, light/dark, wordmark/photo/custom compositions; scrolling and 30 navigations passed. Review caught a media-relative reveal offset and a final-frame capture taken before canvas destruction; both were corrected.

The first full performance run passed readability/LCP/CLS but caught long-article theme interactions at 272ms and 208ms. The 200ms threshold remains unchanged. Browser tracing isolated off-screen code toolbar descendants as the expensive style-recalculation path. Applying content visibility to toolbars reduced controlled theme-switch samples to 48–88ms; the ineffective paragraph experiment was removed. DOM, find, selection, anchors and print output remain available. Full regression is being rerun.

## Final local acceptance — 2026-11-02

- Typecheck and 34 unit tests passed; `npm run verify` passed, including integrations, comments, controls, reading/deep anchors, responsive images, motion and navigation races.
- All 42 controlled performance samples passed: maximum first readable **2450.3ms**, LCP **2240ms**, CLS **0.04335**, representative interaction **168ms**. Limits were not relaxed.
- Beta.8: twelve light/dark desktop/mobile compositions, sixty clock-controlled frames, wide/tall positioned transparent targets, long Chinese/mixed wordmarks, delayed/failed/cross-origin media and static fallbacks passed. Thirty navigations retain one shell and do not accumulate global listeners or canvases.
- Reviewed all twelve static baseline images, all sixty print frames, the real-time entrance/print sequence, and public showcase home/photo/custom/third-screen views. New baseline: `tests/visual-baselines/win32-edge-156.0.4314.58-beta8`; historical baseline retained.
- Node 22.14.0 / 24.18.0 × Hexo 7 / 8 × root / subdirectory passed (eight combinations). UTC, Asia/Shanghai and America/Los_Angeles passed.
- The current-version package passed installation outside the repository with fresh dependencies. Public showcase paths, search, resources and public-content checks passed. Each showcase variant uses an isolated Hexo process to avoid cross-instance asset caching.

## Release record and continuation

Only `Drtxdt/Hypergraph` is configured for Pages; publication source is GitHub Actions. Public URL: https://drtxdt.github.io/Hypergraph/.

The main workflow requires fast checks, two independent browser runs, both compatibility runtimes and package installation before building the showcase from that same installed package. The `github-pages` environment deploys only main. PRs only build and validate.

The exact source/deployment commit, installed package SHA256 and actual URL are recorded automatically in the deployed [build.json](https://drtxdt.github.io/Hypergraph/build.json). [Main workflow runs](https://github.com/Drtxdt/Hypergraph/actions/workflows/verify.yml?query=branch%3Amain) retain the CI and Pages outcome. This avoids a self-referential release SHA in the commit that creates it.

Local evidence: `.local/verification/report.json`, `.local/beta8/report.json`, `.local/compat-v2/report.json`, `.local/timezone-verification/report.json`, `.local/install-v21-report.json`, and `.local/showcase/public/build.json`.

Release continuation: push the validated main commit, wait for the gated Pages deployment, then smoke-test the actual URL, all three entries, article deep links, search and resources. For subsequent maintenance, preserve these gates and create a new reviewed baseline only when the intended visual design or browser changes.

## Public cold-load follow-up

The first main release (`fe0ac0c`) passed all eight CI/build/deployment jobs. Live cold-load verification exposed a network waterfall: the entry module, its static helper and then the print chunk could arrive after the entrance. The page correctly retained static content, but ordinary first visits should prepare earlier.

The follow-up preloads the entry module and its static dependency graph in the document head. Eligible homepages also preload the print chunk; reduced motion, save-data, disabled decoration, anchors and history retain their guards. A regression delays every JavaScript request by 900ms to verify parallel preparation. A real-network diagnostic with the revised head confirmed print start around 2400ms and completion around 3240ms; arrivals beyond the entrance budget continue to use the specified static fallback.

Follow-up evidence: all 42 controlled performance samples passed with maxima of first readable 2420ms, LCP 2224ms, CLS 0.04335 and interaction 112ms. The delayed-request regression and its real-time recording passed; Node/Hexo/root and timezone matrices passed again. Final acceptance and deployed source identity are recorded by the report and main workflow links above.

## Follow-up: slower print and softer reading edges

- User feedback supersedes the original 840ms local timeline: printing now takes 1600ms; the entrance and preparation window remain unchanged. Controlled-clock frames use 400ms quarters.
- Public showcase retains the original demo navigation and music control. Variant links move into the homepage content instead of replacing the left rail.
- Both fixed terrain crops fade at their inward vertical edges; chapter bands fade at their ends. Opaque reading surfaces have broad paper-colored feathering outside their bounds, preserving text contrast and selection. Mobile uses a narrower halo.

Validation: `npm run verify:fast` (34 tests), full `node tools/verify.mjs` including exact-package installation, the beta.8 controlled-clock/lifecycle/30-navigation suite, and public showcase routes/search/assets passed. All 42 performance samples passed: maximum readable 2415.1ms, LCP 2212ms, interaction 56ms, CLS below 0.1. Twelve static baseline images and the public homepage/third-screen reading views at 1440px and 390px in both themes were reviewed. Local Waline cold dependency loading initially exceeded its startup budget; warming the unchanged dependencies restored startup to 1273ms and the full suite passed without relaxing limits.

## Follow-up: text-first article openings

Article covers now default to `none`; the portrait example no longer forces a compact cover. Homepage/list thumbnails and images inside the article body remain unchanged. Explicit cover configuration remains available.
