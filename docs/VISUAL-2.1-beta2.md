# Hypergraph 2.1.0-beta.2

Baseline: beta.1 commit 5a6b7e6; user-requested pre-edit checkpoint a64f9e2. No original blog edits or online deployment.

## Changes

Reading uses a metadata rail, shared title/body axis, 42rem maximum prose and a wider right TOC. Compact covers default to 160px desktop / 112px phone; feature and none are explicit choices. Empty TOCs stay hidden, including before encrypted content is unlocked. Desktop rail expansion is hover/focus only, with stable icon positions, delayed close and Escape suppression; touch-only wide screens use the compact menu.

The homepage keeps an asymmetric covered lead and an independent text lead. Dates replace decorative record numbers; the featured date is not repeated. Typography uses system UI fonts; code retains a monospace stack. Language emblems, code copy and larger labels share one compact header. Syntax colors are defined independently for light/dark code themes. Search, sharing, reading controls, tables, tags and protocol-key interactions share accessible icon controls and directional fill feedback.

The entrance percentage means animation progress. Intended movement: 480ms to 60%, 1000ms hold, 480ms to 100%, 480ms reveal with concurrent homepage entrance. Measurement starts when the bootstrap shows the overlay, not after a lazy module arrives. A navigation-relative 2350ms fail-open budget prioritizes the 2500ms readability target and can truncate the final reveal or a slow start. No completion percentage is fabricated on cancellation. Skip, background, reduced motion and unavailable storage are handled separately.

Home-to-article transitions use 100ms exit, 120ms content mask and 180ms concurrent reveal/title entrance. Other visits use short 80ms exits and 160ms entrances. History, anchors and reduced motion bypass choreography. Stale failed requests cannot reset a newer visit's URL; audio remains outside the replaced container.

## Reproduction and evidence

`npm run verify` builds from public fixtures, checks types/units, navigation, responsive screenshots, 30 visits, history/failure retry, search, encryption output isolation, diagrams, SQLite Waline, independent extensions, disabled requests, no-JavaScript and reduced motion. Beta.2 adds code-toolbar copying, immediate TOC selection, key visibility/errors, stale failed navigation and wide touch menus. Entrance videos include desktop/phone, timing frames at 60%, monotonic percentage/bar synchronization, skip and blocked-script recovery. Reports bind the commit, dirty state, browser, OS, actual fonts, SHA256 resources and source files.

`npm run verify:compat` runs Node 22/24 and Hexo 7.3/8 at root and /blog/. CI executes Linux Chromium independently. Local Windows Edge and Chrome navigation checks are separate from the full compatibility build matrix.

`node tools/package-release.mjs` creates the distributable; `node tools/verify-install-v21.mjs` installs that version into a fresh site and tests an independent extension's installation, upgrade and disable. `node tools/verify-private-v21.mjs` reads the original blog and operates only on a copy, checks 43 posts and a 116372-character article, dates, slugs, source hashes and audio identity.

Artifacts remain in `.local/verification`, `.local/compat-v2`, `.local/install-v21-report.json`, `.local/private-v21-report.json`, and `dist/hexo-theme-hypergraph-2.1.0-beta.2.tgz`. They are not committed. The report's passed/full fields and matching commit/resource hashes determine validation, not this implementation mapping. The PR records the final observed results.

Screenshots are evidence for this build and do not overwrite approved beta.1 baselines. The user approved the preceding reading slices and requested further polishing; final visual judgment remains human. Official WACZ is local source-reference evidence, not a verified official runtime replay. Live production comment credentials, public-network performance and field INP are outside the local/CI certification.
