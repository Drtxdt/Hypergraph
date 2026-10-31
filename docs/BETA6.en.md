# beta.6: configure your site

Build the package from the repository: `git clone https://github.com/Drtxdt/Hypergraph.git`, `cd Hypergraph`, `npm ci`, `npm run build`, `npm run pack:theme`. In a fresh Hexo site install the absolute path to `dist/hexo-theme-hypergraph-2.1.0-beta.6.tgz`; set `theme: hypergraph`. Remove competing Markdown renderers, then `npx hexo clean` and `npx hexo generate`. Node 22.12+ / 24 and Hexo 7.3 / 8 are supported.

Set `title`, `author`, `description`, canonical `url`, and optional `root: /blog/` in the site configuration. Theme overrides go in `_config.hypergraph.yml`; objects inherit defaults and arrays replace them.

## Identity, navigation and media

The default menu references Home, Archives, Gallery, Notes, Friends, Tools, Games and About. Disable an entry with `enable: false`, or supply the complete ordered menu. `page: about` follows `pages.about.path`; disabling the page hides its entry. Handwritten pages at the same generated route take precedence.

```yaml
home:
  title: My journal
  description: Notes and projects
  sections: [masthead, featured, posts]
  masthead:
    enable: true
    image:
      src: /images/landscape.jpg
      mobile: /images/portrait.jpg
      fit: contain
      alt: A description of the scene
      caption: Photo credit
    action: {label: Browse, url: /archives/}
  topics: auto
background:
  mode: frame
  opacity: 0.12
  image: {src: /images/texture.svg}
page_banner:
  enable: true
  height: 260
  overrides:
    about: {src: /images/about.jpg}
```

The site masthead is independent of post covers and only appears on the first homepage. Featured posts use compact recommendations; sticky selection, deduplication and pagination remain intact. `home.topics` accepts `auto`, up to three `{title, description, url, image}` objects, or `[]` to disable it.

Image objects accept `src/mobile/dark/mobile_dark`, `fit`, `position/mobile_position`, `alt`, `caption`, and a single `fallback`. Mobile dark selection falls back through mobile, dark, then src. Manual color mode overrides the system. `contain` preserves the whole picture; `cover` crops at the selected percentage focus. `show_cover: false` suppresses foreground media while leaving environmental backgrounds independently configurable.

`background.mode` is paper (no environmental requests), frame (edge atmosphere), or home (homepage only). Page banners resolve explicit front matter `page_banner`, exact override, page-type override, then default. `false` disables a target. Category/tag override keys use `category:Name` / `tag:Name`. Tool/game operation pages stay compact without a banner. Posts retain their own cover, cover_mode, cover_position and cover_fit.

## Structured pages

Use `source/_data/hypergraph.yml`. About, friends and gallery require objects; deprecated arrays now fail with a location-specific diagnostic.

```yaml
about:
  sections:
    - title: A project
      description: What I built
      image: /images/project.jpg
      url: /archives/
friends:
  groups:
    - title: References
      items:
        - {title: Hexo, url: 'https://hexo.io', description: Blog framework}
gallery:
  albums:
    - slug: field
      title: Field notes
      photos:
        - {image: /images/landscape.jpg, caption: A view, width: 1200, height: 800}
```

About also accepts profile, projects, timeline, interests, links and posts. Friends can supply application instructions. Gallery creates directory and album detail routes. Missing sections are omitted. Other collection arrays remain unchanged.

## Tools, games and verification

`pages.tools.builtins: [json, text, codec]` and `pages.games.builtins: ['2048', minesweeper]` replace the defaults. Tools/games data may include `links` cards with title, description, url, icon, image and group. Tool input is limited to 1 MiB. The hashed Worker always loads from the site origin, even when normal assets use a CDN; failures retain input and can be retried.

`npm run verify:fast` checks types and unit rules. `npm run verify` builds and runs the complete browser suite. `npm run verify:package -- /absolute/package.tgz SHA256` installs exactly the supplied package. Missing or mismatched hashes fail before installation.

Entrance defaults to always: 480ms → 60% hold 600ms → 480ms → full sweep 240ms → fade 600ms. Media loads concurrently. History restoration, deep anchors, reduced motion, data saving and background tabs bypass the entrance. The 4-second emergency release does not replace the normal 2.5-second readability limit.

See [recipes and licenses](../examples/recipes/README.md), [full configuration](config-reference.yml), and [breaking-field migration table](BETA6-MIGRATION.md).
