# 2.1.0-beta.2 visual checkpoint

Status: implementation in progress; awaiting the planned article-slice visual review. This is not a release acceptance report.

Implemented in this checkpoint: desktop expand-button removal; hover/focus reconciliation after navigation; fixed sidebar icon geometry; article title/body grid; compact/feature/none cover selection; home-only intro scope; compact mobile TOC entry with existing panel manager.

Evidence: `.local/reading-beta2/report.json` and the eight cover/noCover × desktop/mobile × light/dark screenshots. Run `node tools/verify-reading-beta2.mjs` to regenerate the public fixtures and evidence. Run `node tools/preview-reading-beta2.mjs` after verification to serve both samples. The navigation regression command remains `node tools/verify-navigation-v21.mjs`.

Remaining after visual approval: full prose/home polish, 60-percent entrance timeline and shared fail-open controller, route-specific transitions, coarse-pointer navigation and extended keyboard/modal audit, full responsive/fault/performance matrix, documentation completion, packaging and PR/CI verification. Original blog and PR are unchanged at this checkpoint.

User review amendment: remove the top coordinate banner; use system UI typography for display and metadata (monospace remains for code only); hide rail scrollbars while retaining vertical scrolling; TOC 15px. Entrance movement durations are doubled: 480ms + 1000ms at 60% + 480ms + 480ms exit = 2440ms, with a 3500ms independent fallback. This replaces the former 2-second entrance cap; previous performance acceptance does not certify this changed timing.

Controls review: icon controls retain accessible labels and native tooltips; yellow hover/focus fill travels left to right. X/email use share URLs, Bilibili/Instagram explicitly copy the article link for manual posting (no automatic publication). Empty share_sites still disables platform shortcuts; share:false removes the entire sharing group. Search uses a focused input, bounded result viewport, live status and icon pagination.

Reading controls amendment: grey icon surfaces, diagonal-stripe tags, removal of standalone post-credit block (copyright settings retained), separate code/table copy controls excluding syntax-highlight tables, styled password form, immediate TOC link selection with scroll-position reconciliation and per-root listener cleanup. More share shortcuts: Telegram, Reddit, LinkedIn and Facebook. Third-party posting itself is not automated or certified by local UI tests.
