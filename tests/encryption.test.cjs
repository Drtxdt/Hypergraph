const { test } = require("node:test");
const assert = require("node:assert/strict");
const { encrypt, decrypt } = require("../lib/encryption.cjs");
test("authenticated encryption roundtrip, unique nonce and no plaintext", () => {
  const text = "<h2>PRIVATE_CANARY_1</h2>中文 + x²";
  const a = encrypt(text, "test-password"),
    b = encrypt(text, "test-password");
  assert.equal(decrypt(a, "test-password"), text);
  assert.notEqual(a.data, b.data);
  assert.ok(!JSON.stringify(a).includes("PRIVATE_CANARY"));
  assert.throws(() => decrypt(a, "wrong-password"));
  const bytes = Buffer.from(a.data, "base64");
  bytes[0] ^= 1;
  assert.throws(() =>
    decrypt({ ...a, data: bytes.toString("base64") }, "test-password"),
  );
});
