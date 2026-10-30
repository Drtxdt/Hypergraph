# 2.1.0-beta.4

The default home now starts with a compact identity band, followed by the featured article and records. `home.sections` defaults to `[intro, featured, posts]`; explicitly configured arrays still replace that default. `home.title/description`, the site author, `appearance.avatar/author_status` and existing category data supply the content. No new visual preset is introduced.

Empty and single-post sites omit empty record sections and single-page pagination. Homepage media links to the corresponding article. Archive month anchors, category links and expandable tags support discovery; article reading columns remain unchanged.

## Entrance

The entrance label denotes animation progress, not byte download progress. Nominal stages: 480 ms to 60%, 800 ms hold, 480 ms to 100%, 240 ms yellow sweep, 400 ms fade. The normal timeline uses navigation time so delayed optional modules do not restart the animation. A minimal inline bootstrap owns the clock and readiness; it observes the already parsed content, core stylesheet and the main cover load/decode, not comments, audio or below-fold images.

Pending cover loading delays the 0–60% stage. There is an independent 4-second maximum visible-blocking budget. Normal completion, skip, hidden tab, resource timeout, insufficient remaining budget and script errors are reported separately through `window.__hgIntroResult` and the existing `hypergraph:intro-end` event. The event is emitted once. Standard controlled readability remains limited to 2.5 seconds; deliberately stalled resources are separate fault-injection cases, not a way to accept ordinary regressions.

`appearance.intro` remains `always` by default. Explicit `session/off`, history restoration, hashes, reduced motion and save-data behavior remain supported.

## Controls and media

On mobile, the square back-to-top button appears in document flow before the footer. Desktop shows it after one viewport of scrolling. The mobile outline owns a two-column header with a 44 px close target. Audio range inputs retain thin visual rails with 44 px interaction areas.

The lightbox supports not-yet-loaded images, responsive sources, loading/failure/retry states and stale-load protection. Changing a picture starts its reveal only after decode. Closing the dialog or changing pages invalidates pending results.

## Content and migration

`examples/content` supplies licensed photographs, a portrait, original technical artwork and short notes. Its README records sources and cover safety guidance. Keep original government imagery as article content only; no endorsement or author identity is implied.

Run `node tools/cover-candidates.mjs /path/to/source/_posts` to print a read-only JSON list of possible covers from existing excerpts. Explicit covers and encrypted posts are excluded. Review candidates manually; the tool does not edit, download, or apply them.

## Validation

`npm run verify` executes media UI and entrance coverage as separate groups, plus beta.4 layout/lazy-image checks, existing functionality, performance and recorded motion. Failures retain intermediate performance samples and animation frames before assertions. The Range-capable local fixture server supports actual audio seeking.

Screenshots and geometric checks are evidence, not automatic design approval. Existing pixel baselines are never overwritten. Final delivery reports bind results to a commit and build hashes and distinguish local, CI, private-copy and external-service coverage. Production third-party services and real-user INP require separate deployment evidence.

## Static hosting and benchmark transport

The package includes `main.css.gz` and `main.js.gz`, built from the same source assets. Enable compression on your static host; for nginx with `ngx_http_gzip_static_module`, use `gzip_static on; gzip_vary on;` in the site/location configuration. Keep the ordinary files for clients that do not accept gzip. CDN-managed compression is also suitable. Do not serve `.gz` bytes as ordinary CSS/JavaScript without `Content-Encoding: gzip`.

The beta.4 controlled benchmark explicitly negotiates these shipped sidecars (other files remain uncompressed). This hosting condition is recorded in every report. Earlier uncompressed runs missed the 2.5-second entrance/readability target (3.39 seconds before the bootstrap fix, 2.70 seconds afterward); those failures remain evidence and are not claimed as passes. A host that ignores compression must be measured separately. Functional reading and the four-second emergency escape do not depend on compression.
