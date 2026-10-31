"use strict";
const headingAnchors = require("../lib/heading-anchors.cjs");
hexo.extend.filter.register("after_post_render", data => {
  for (const field of ["content", "excerpt", "more"])
    if (data[field]) data[field] = headingAnchors(data[field]);
  return data;
}, 9000); // After content tags, before encryption.
