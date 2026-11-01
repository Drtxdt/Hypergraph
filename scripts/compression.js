"use strict";
const { gzipSync } = require("node:zlib");
// Deliver the same bytes through hosts supporting gzip_static; original HTML
// remains available on hosts without compression negotiation.
hexo.extend.filter.register("after_generate", async function () {
  for (const route of hexo.route.list().filter(name => name.endsWith(".html"))) {
    const chunks = [];
    for await (const chunk of hexo.route.get(route)) chunks.push(Buffer.from(chunk));
    hexo.route.set(route + ".gz", gzipSync(Buffer.concat(chunks), {level:9}));
  }
}, 100);
