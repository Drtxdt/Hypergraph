# Hypergraph beta.9 implementation ledger

Baseline: main 3d2766d. Approved 2026-11-03.

## Decisions
- Publish the mobile navigation hotfix first; release the complete visual revision after validation.
- Preserve the left rail, persistent environment, Swup lifecycle, 2400ms intro and 1600ms print.
- Prioritize reading and retrieval with game-interface hierarchy. Featured content leads the no-image homepage; merge identical fallback brand/title with one accessible H1.
- Keep continuous 42rem prose with feathered reading surfaces. Compose natural ridge/saddle terrain for corners, section bands and selected states; retain desktop two corners/mobile one and 30KiB gzip budget.
- Separate wordmark/transparent-mark formation from photo material scanning. Recheck visibility before starting, reuse font/color tokens and preserve all static fallbacks.
- Add optional search date/categories and safe highlighting, keyboard result selection. Preserve old indexes and encrypted-content exclusion.
- Mobile music starts collapsed, becomes a mini player after intentional playback, and persists across navigation.
- Preserve performance gates and budgets; establish reviewed Linux visual baselines in a fixed browser/font environment, with actual/diff reports and no automatic acceptance.
- Only Hypergraph and its public demo are in scope. Article cover default remains none. No new public particle options.

## Delivery and verification
1. Fix mobile header clipping and menu fill containment; exercise actual touch hit testing, navigation, focus and inert cleanup; validate and publish main.
2. Establish Linux baseline and four static scenes (no-image home, photo home, article third screen, mobile home).
3. Implement terrain, printing, search and mobile music; inspect light/dark/background combinations and timing recordings.
4. Run fast/full/compat/package checks, 30-navigation lifecycle checks and performance gates; update generated references/docs; release 2.1.0-beta.9 to main and verify deployed deep links and resources.

## Progress
- Implementation and local functional verification complete. Final Linux CI passed; main publication and online verification are the remaining release steps.
- Untracked .vscode directory predates this work and will be left untouched.
- Mobile hotfix committed and pushed as 4e24391. Typecheck, 34 unit tests and coordinate-based touch navigation passed. Its CI exposed a previously masked mobile music panel overlapping menu controls; beta.9 starts the player collapsed in server markup and keeps it out of an open menu.
- Visual implementation on codex/beta9: 79fa5eb, followed by CI native-build prerequisite and mini-player assertion correction 239d26d.
- Contour assets: 23,333 gzip bytes. Print geometry/lifecycle suite and 30-navigation checks passed. Node 22.14/24.18 × Hexo 7/8 × root/subdirectory matrix passed (8 combinations).
- First local full runs hit cold Waline initialization timeouts; isolated SQLite startup subsequently passed and functional verification progressed. No service or performance gate was weakened.
- A concurrent local performance run had three interaction samples above 200ms. The later painting fix and successful controlled CI runs below supersede that failure; no performance threshold was relaxed.
- Fixed Playwright 1.64.1 Linux image, CJK font fingerprint, visual evidence gallery and explicit baseline/actual/diff generation added. Linux baseline review is complete.
- Follow-up 1fbeefc removed redundant whole-article shadows and broad dynamic menu selectors. All six focused long-article samples passed (maximum interaction 184ms); CI run 41585333217 passed all 42 performance samples, fast checks, both compatibility jobs and the exact-package installation job.
- Updated the legacy mobile audio verification to expand the mini player before checking mute, volume and seek. Both 1440px and 390px UI-polish suites passed, including no-JS audio controls.
- Reviewed 36 Linux layout screenshots and 60 print frames from run 41585333217. Accepted twenty static baseline views; caught and removed the previous TOC item's color transition that briefly made its text unreadable after scrolling. The transient third-screen frame was not accepted as a baseline.
- Final print regression passed, including moving a prepared target offscreen before intro-end: no Canvas starts and the static wordmark is restored.
- Final candidate `7e4695e6e859468c6f4321ac9f8b11574925dcd1`: [CI run 41593842980](https://github.com/Drtxdt/Hypergraph/actions/runs/41593842980) passed fast checks, Node 22/24 compatibility, exact-package installation, full functional verification, all twenty reviewed Linux visual comparisons and all 42 controlled performance samples.
- Fresh local functional verification also passed in full: real touch navigation, print geometry and lifecycle, 30 navigation cycles, desktop/mobile UI, integrations, extensions, real SQLite comments and nine motion flows. Reviewed the final third-screen capture: terrain persists and both current and previous TOC entries remain readable.
- Release tracking: main push triggers the same complete gates before Pages publication. The public [build.json](https://drtxdt.github.io/Hypergraph/build.json) records the deployed commit, version, exact package SHA-256 and actual base URL; the main Actions run is the authoritative deployment evidence.
