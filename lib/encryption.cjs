"use strict";
const {
  randomBytes,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
} = require("node:crypto");
const iterations = 210000;
function encrypt(content, password) {
  const salt = randomBytes(16),
    iv = randomBytes(12),
    key = pbkdf2Sync(String(password), salt, iterations, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([
    cipher.update(content, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    version: 1,
    iterations,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: data.toString("base64"),
  };
}
function decrypt(payload, password) {
  const key = pbkdf2Sync(
      password,
      Buffer.from(payload.salt, "base64"),
      payload.iterations,
      32,
      "sha256",
    ),
    body = Buffer.from(payload.data, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(body.subarray(-16));
  return Buffer.concat([
    decipher.update(body.subarray(0, -16)),
    decipher.final(),
  ]).toString("utf8");
}
module.exports = { encrypt, decrypt };
