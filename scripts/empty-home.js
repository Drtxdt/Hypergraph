"use strict";
// Hexo's index generator emits no route when a site has no posts.
hexo.extend.generator.register("hypergraph-empty-home", function (locals) {
  if (locals.posts.length) return [];
  return { path: "index.html", layout: "index", data: { current: 1, total: 1, posts: locals.posts } };
});
