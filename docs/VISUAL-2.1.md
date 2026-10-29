# Hypergraph 2.1 visual implementation

Development version: 2.1.0-beta.1. Source baseline: 76ffbf2.

Reference: user-provided WACZ SHA256 70853f68c7b7dca8cfcf6aa8b31a67bd48174ec58334534d31095224ddd10563.
The reference loader and navigation were inspected in archived JavaScript/CSS. Official runtime replay was not measured. Timings here are deliberate theme adaptations.

Implemented: session entrance with an independent 1200ms fail-open bootstrap (within the 2-second limit), vertical desktop/horizontal mobile progress, hover/focus/pinned rail, asymmetric hero, explicit-cover records, Archivo 800, and awaited Swup transitions. The normal entrance uses 480ms progress, 60ms completion hold and 360ms exit; slow or failed resources can end through the independent fallback without claiming successful loading.

Run `node tools/verify-navigation-v21.mjs` for real pointer and focus behavior. Run `node tools/verify-motion-v21.mjs` for desktop/mobile recordings and screenshots in `.local/motion-v21`. Run `npm run verify` for the broader regression suite.

The 2.0 report and approved screenshots describe the previous release. They do not certify 2.1. New recordings and screenshots are review artifacts, not automatically approved baselines. Human visual acceptance remains the user's judgment. WACZ inspection confirms source behavior; these recordings demonstrate the theme adaptation, not a timed replay of the official website.


## Measured checks

15 unit tests and type checking passed. The 8 Node/Hexo/root combinations passed. Motion fault injection passed 9 flows. The mobile focus regression was reproduced before its fix, then passed using the actual page.

Mobile performance checks use 390x844, CPU 4x, 150ms latency and 1.6Mbps bandwidth. Both fresh-session and subsequent visits are measured for covered home, uncovered home and the long article, three samples each. Readability uses the first two visible animation frames after DOM readiness, not the time the test driver receives the page load event.

Earlier diagnostics failed at 2724ms with a 2000ms fallback and 2524ms with a 1500ms fallback. The final independent fallback is 1200ms to provide headroom without relaxing the 2500ms readability threshold. `.local/performance-v21/report.json` retains the failed diagnostic; the final unified report is authoritative for release acceptance. No missing or invalid performance sample is treated as a pass.

Final unified run: `passed: true`, `buildMode: full`, 15 unit tests, browser functional/visual checks, 30-navigation stress, local service integration, 9 motion flows and all 18 performance samples passed. First-session maxima: LCP 904ms, readability 2104.9ms, CLS 0.082462, interaction 56ms. Subsequent-visit maxima: LCP 832ms, readability 2066.4ms, CLS 0.082302, interaction 56ms. Maximum measured JavaScript gzip is 23396 bytes and CSS gzip is 7982 bytes. Font and image transfer sizes are reported separately in the JSON.

## Delivery evidence

- Unified verification: `.local/verification/report.json`; includes browser/OS/font, source baseline plus dirty state, resource hashes, functional checks, navigation stress, local SQLite Waline, mobile performance and motion fault injection. The final run's `buildMode` and `passed` fields are authoritative.
- Motion artifacts: `.local/verification/motion-v21/`; desktop/mobile recordings, light/dark screenshots, entrance visibility timing and cancellation/failure evidence.
- Compatibility: `.local/compat-v2/report.json`; Node 22/24, Hexo 7.3/8 and root/subdirectory combinations (the verifier retains its legacy output directory). This is a separate run rather than a claim that every browser test ran on every combination.
- Clean installation: `.local/install-v21-report.json`; fresh installation, independent extension install/upgrade/disable and SHA256 of the exact tested tarball.
- Private validation: `.local/private-v21-report.json`; 43 original article hashes, dates and slugs preserved, 116372-character article, 16 responsive/light/dark views, persistent audio playback. Generated copy: `.local/private-v21`. The original blog was not changed.
- Package: `dist/hexo-theme-hypergraph-2.1.0-beta.1.tgz`. Reproduce with `node tools/package-release.mjs`, then `node tools/verify-install-v21.mjs`.
- Public-content local preview: `node tools/preview-v21.mjs` prints its temporary local URL. No online deployment is performed.

Third-party production credentials/services were not certified; local service integration and SDK isolation are distinguished from live deployment. The private source and WACZ are excluded from distribution. Existing 2.0 packages/backups remain intact.
