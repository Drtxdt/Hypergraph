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
- Plan recorded. Implementation in progress; no release claimed.
- Untracked .vscode directory predates this work and will be left untouched.
- Mobile hotfix committed and pushed as 4e24391. Typecheck, 34 unit tests and coordinate-based touch navigation passed. Its CI exposed a previously masked mobile music panel overlapping menu controls; beta.9 starts the player collapsed in server markup and keeps it out of an open menu.
- Visual implementation on codex/beta9: 79fa5eb, followed by CI native-build prerequisite and mini-player assertion correction 239d26d.
- Contour assets: 23,333 gzip bytes. Print geometry/lifecycle suite and 30-navigation checks passed. Node 22.14/24.18 × Hexo 7/8 × root/subdirectory matrix passed (8 combinations).
- First local full runs hit cold Waline initialization timeouts; isolated SQLite startup subsequently passed and functional verification progressed. No service or performance gate was weakened.
- A concurrent local performance run had three interaction samples above 200ms. An isolated repeat is running; it must pass before release.
- Fixed Playwright 1.64.1 Linux image, CJK font fingerprint, visual evidence gallery and explicit baseline/actual/diff generation added. Linux baseline review and final deployment remain pending.
