# Hypergraph

An original editorial Hexo theme with light/dark modes, one Endfield-inspired design, structured configuration, locally bundled optional modules, and a versioned extension API.

Requires Node.js 22.12+ or 24 and Hexo 7.3 or 8. Install the delivered tarball in your Hexo site, set `theme: hypergraph`, remove other Markdown renderers, and run `hexo clean && hexo generate`. Assets are precompiled; Vite is only needed when developing the theme.

```sh
npm install ./hexo-theme-hypergraph-2.0.0.tgz
npm uninstall hexo-renderer-marked hexo-renderer-markdown-it
```

Set the site language to `en`. Put theme overrides in `_config.hypergraph.yml`. Objects merge, arrays replace, and unknown properties produce errors with configuration paths. Use `preset: endfield`. Navigation is an ordered array of `{label, url, icon}` items with optional one-level `children`. Remove the old `layout` setting. `appearance.motion` accepts `cinematic`, `subtle`, or `off`; reduced motion and data saving are respected. See `docs/config-reference.yml` for every setting and default.

The theme includes its own Markdown-it renderer, server-rendered syntax highlighting, KaTeX and optional MathJax SVG. Set `math_engine: mathjax` or `math_engine: off` in individual posts. Use `cover`, `banner`, `summary`, `series`, `sticky`, and `comments` in front matter. Encrypted posts use `password` and an intentionally public `abstract`; use a strong password and never put private text in metadata. Their bodies are excluded from search and Atom output and comments are disabled.

Local search, archive/category/tag pages, reading mode, code copying, diagrams, charts, ABC notation, image galleries, collections, comments, share links, rewards, analytics, chat, AI-summary endpoints, feeds, and PWA installation are configurable. Optional modules load only when used. Music starts on visitor interaction and stays alive during enhanced navigation. Network failures preserve the current page and expose Retry.

Create collection data in `source/_data/hypergraph.yml`, keyed by `about`, `friends`, `gallery`, `essay`, `equipment`, `music`, `room`, or `fcircle`. Enable each collection through `pages.<type>.enable`. Items accept title, description, image, URL, date, audio, and status. `pages.fcircle.endpoint` can provide an array, an `items` array, or an `article_data` array.

Waline is the default comment adapter and supports anonymous visitors. Configure a public `comments.server` URL; credentials belong on the server. `deploy/waline` provides the Vercel/PostgreSQL deployment template. Other adapters and their parameters are listed in `docs/SERVICES.md`. Third-party accounts and production endpoints must be configured and tested by the site owner.

Extensions are installed as npm packages. Export `apiVersion: 1`, an ID, JSON Schema, optional build setup, and an independently built browser module. Page modules return cleanup functions. Presets can replace full Nunjucks templates. See `docs/EXTENSIONS.md` and `examples/extension`.

Development: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Theme source is MIT licensed; bundled dependencies retain their licenses in `source/licenses`.

Run `npm run verify` for isolated public fixtures, browser tests, SQLite comments, and mobile performance. Install Chromium with `npx playwright install --with-deps chromium` outside Windows; Windows uses Edge by default. Set `HG_BROWSER=chromium` to select Chromium. `npm run verify:compat` checks Hexo 7.3/8 and root/subdirectory builds. Reports are in `.local/verification`; temporary sites are removed. No private blog is required.
