const test = require('node:test');
const assert = require('node:assert/strict');
const { pagePath } = require('../lib/page-path.cjs');
test('page links and generators share default and custom paths', () => {
  assert.equal(pagePath('about'), 'about/');
  assert.equal(pagePath('about', {path:'profile'}), 'profile/');
  assert.equal(pagePath('about', {path:'/profile/'}), 'profile/');
});
