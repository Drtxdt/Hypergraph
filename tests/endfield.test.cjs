const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('featured selection stays on the current page and preserves order and count', () => {
  const helpers = {};
  const config = { home: { featured: true, sections: ['featured', 'posts'] } };
  vm.runInNewContext(fs.readFileSync('scripts/navigation.js', 'utf8'), {
    require: () => ({ escape: String }),
    hexo: { theme: { config }, extend: { helper: { register: (name, fn) => helpers[name] = fn } } }
  });
  const posts = [{ path: 'a' }, { path: 'b', sticky: 4 }, { path: 'c' }];
  const result = helpers.hg_selection({ current: 1, posts: { toArray: () => posts } });
  assert.equal(result.lead, posts[1]);
  assert.deepEqual(Array.from(result.posts), [posts[0], posts[2]]);
  assert.equal(posts.length, 3);
  assert.equal(helpers.hg_selection({ current: 2, posts: { toArray: () => posts } }).lead, null);
  config.home.featured = false;
  assert.equal(helpers.hg_selection({ current: 1, posts: { toArray: () => posts } }).lead, null);
});

test('cover tint alone loads appearance, all disabled loads nothing', async () => {
  const source = fs.readFileSync('src/main.ts', 'utf8');
  const start = source.indexOf('async function mountAppearance');
  const end = source.indexOf('let pageController', start);
  const javascript = ts.transpile(source.slice(start, end), { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
  for (const cover_tint of [true, false]) {
    let loads = 0, mounts = 0;
    const context = { appearance: { fallback_image: '', captions: false, motion: 'off', cover_tint }, require: () => { loads++; return { mount: () => mounts++ }; } };
    vm.runInNewContext(javascript, context);
    await context.mountAppearance({}, { aborted: false });
    assert.equal(loads, Number(cover_tint));
    assert.equal(mounts, Number(cover_tint));
  }
});
