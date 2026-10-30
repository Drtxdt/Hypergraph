# beta.5: installation and configuration

Use Node 22.12+ or 24 with Hexo 7.3 or 8. In your site's working copy:

```sh
npm install ./hexo-theme-hypergraph-2.1.0-beta.5.tgz
```

Set `theme: hypergraph` and your `title`, `author`, `description`, and canonical `url` in `_config.yml`. Set `root: /blog/` for a subdirectory. Follow [QUICKSTART](QUICKSTART.md) for the Markdown-it renderer, then run `npx hexo clean` and `npx hexo generate`. Vite is not required by theme users.

## Identity and navigation

Overrides belong in `_config.hypergraph.yml`. Omit `menu` to use Home, Archives, Gallery, Notes, Friends, Tools, Games, and About. There is no default logo; `site_logo` remains available. Use `appearance.avatar` and `appearance.author_status` for your own identity.

```yaml
pages:
  about: {enable: true, path: profile/}
  essay: {enable: false}
  tools: {enable: true, builtins: [json, text, codec]}
  games: {enable: true, builtins: ['2048', minesweeper]}
```

Disabling a page hides menu entries referencing that page. To reorder navigation, specify a complete `menu` array: arrays replace defaults. Each entry accepts `label`, `icon`, optional `enable`, and exactly one of `url`, `page`, or one-level `children`. Children support `enable` too. For example `{label: about, page: about, icon: user}` follows the configured About path. Handwritten pages at the same route take precedence.

## Homepage and images

`home.sections` defaults to `[intro, featured, posts]`; explicit order is respected. Featured selection uses the highest `sticky` value on the first page, without altering subsequent pagination. Category destinations reflect real content.

Set post `cover` or `banner`. `appearance.cover_fit: cover` crops using `cover_position: '50% 50%'`; `contain` shows the entire image without overlapping text or enlargement. Post `cover_fit` overrides the global setting. `cover_mode: compact/feature/none` and `appearance.show_cover: false` retain their priority. Body images keep their natural proportions.

```sh
npx --no-install hg-cover-candidates source/_posts
```

This packaged command outputs JSON candidates from existing excerpt images. The default directory is `source/_posts`. It never changes posts or downloads images, and skips protected posts and posts already having covers. Review candidates before editing front matter.

## Dedicated pages

Store content in `source/_data/hypergraph.yml`. Missing sections are omitted. Existing arrays remain supported. The full YAML example in [BETA5.md](BETA5.md#专页数据) uses the same language-independent fields:

- About: `profile` (`name`, `bio`, optional `avatar`), `projects`, `timeline`, `interests`, `links`, and `posts` (post paths or slugs).
- Friends: `groups` with `title` and `items`, plus optional `application` instructions. Site entries use `title`, `url`, `avatar`, and `description`.
- Gallery: `albums`, each with unique lowercase hyphenated `slug`, `title`, `description`, `cover`, and `photos`. Photos use `image`, `caption`, and optional `width`/`height`. Details are generated at the gallery path plus the slug. Original links work without JavaScript.
- Tools and Games: `links` cards with `title`, `description`, `url`, `icon`, `image`, and `group`. These are native links, not embedded services; favicons are not fetched automatically.

## Local tools and games

JSON validation/formatting/minification, text statistics, URL encoding, and UTF-8 Base64 run in an on-demand Worker. Inputs are neither uploaded nor persisted. The maximum input is 1 MiB. Character counts use Unicode code points; Chinese counts use Han characters; English words use Latin letters with internal connectors. Navigation cancels outstanding work.

2048 uses a 4×4 board; Minesweeper uses 9×9 with ten mines and a safe initial neighborhood. Keyboard, touch, and visible controls are supported. Minesweeper includes flag mode. Games save per tab and pause when leaving or backgrounding the page; unavailable storage does not prevent play. Empty `builtins: []` leaves only link cards. Scripts load only on the respective tool/game route.

## Entrance and verification

Entrance and cover loading run concurrently: 480 ms to 60%, a 600 ms pause, 480 ms to 100%, a 240 ms sweep, then a 600 ms fade. The normal timeline is approximately 2.4 seconds from navigation. A delayed or failed cover does not block text. `always` is the default; `session`, `off`, scope, reduced motion, history restoration, anchors, and data-saving behavior remain supported. Late starts and shortened endings are recorded separately.

`npm run verify` samples photography, SVG, no-cover homepages, long articles, and standalone pages, with three first/subsequent visits each. Performance tests negotiate the shipped gzip sidecars. Hosting must return correct `Content-Encoding` or provide equivalent compression; uploading `.gz` files alone does not enable compression. Input-free stability and interactions are measured independently. Failed samples are retained, not retried to select a passing result. Lab checks do not certify production third-party services or real-user INP.

Older beta guides are historical. Use the final beta.5 report for the exact commit, hashes, evidence, and outstanding coverage. No production deployment is part of this update.
