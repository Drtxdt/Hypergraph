"use strict";
const { parseDocument, DomUtils } = require("htmlparser2");
const { slugize, escapeHTML } = require("hexo-util");

// Insert attributes without serializing HTML: code, math and author markup stay intact.
module.exports = function headingAnchors(html) {
  const doc = parseDocument(html, { withStartIndices: true });
  const elements = DomUtils.findAll(node => !!node.attribs, doc.children);
  const used = new Set(elements.map(node => node.attribs.id).filter(Boolean));
  const edits = [];
  for (const node of elements) {
    if (!/^h[1-6]$/.test(node.name) || node.attribs.id) continue;
    const base = slugize(DomUtils.textContent(node)) || "section";
    let id = base, suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    edits.push({ at: node.startIndex + node.name.length + 1, text: ` id="${escapeHTML(id)}"` });
  }
  for (const edit of edits.sort((a, b) => b.at - a.at))
    html = html.slice(0, edit.at) + edit.text + html.slice(edit.at);
  return html;
};
