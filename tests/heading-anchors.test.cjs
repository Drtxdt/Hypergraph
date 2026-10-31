const test = require("node:test");
const assert = require("node:assert/strict");
const anchors = require("../lib/heading-anchors.cjs");
test("HTML and tag headings get unique anchors without rewriting source", () => {
  const source = '<h2 id="保留">保留</h2><h3>保留</h3><h4><em>深层</em>标题</h4><h5>保留</h5><pre>&lt;h3&gt;code&lt;/h3&gt;</pre><script>"<h3>script</h3>"</script>';
  const output = anchors(source);
  assert.equal(output, '<h2 id="保留">保留</h2><h3 id="保留-2">保留</h3><h4 id="深层标题"><em>深层</em>标题</h4><h5 id="保留-3">保留</h5><pre>&lt;h3&gt;code&lt;/h3&gt;</pre><script>"<h3>script</h3>"</script>');
  assert.equal(anchors(output), output);
});
