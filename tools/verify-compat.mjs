import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
const out = path.resolve(".local/compat-v2");
await fs.mkdir(out, { recursive: true });
const candidates = process.env.HG_COMPAT_NODE22
  ? [process.env.HG_COMPAT_NODE22, process.execPath]
  : process.platform === "win32"
    ? ["D:/nvm/v22.14.0/node.exe", process.execPath]
    : [process.execPath];
const results = [];
const run = (exe, args) =>
  new Promise((resolve, reject) => {
    let output = "";
    const child = spawn(exe, args);
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve(output) : reject(Error(output)),
    );
  });
for (const exe of [...new Set(candidates)]) {
  await fs.access(exe);
  const node = (await run(exe, ["--version"])).trim();
  for (const hexo of ["hexo", "hexo8"])
    for (const root of ["/", "/blog/"]) {
      const dir = path.join(
        out,
        node + "-" + hexo + (root === "/" ? "-root" : "-subdir"),
      );
      await run(exe, [
        "tools/verify-generate.mjs",
        dir,
        JSON.stringify({ hexo, root }),
      ]);
      results.push({ node, hexo, root, passed: true });
      console.log(node + " " + hexo + " " + root + " passed");
    }
}
await fs.writeFile(
  path.join(out, "report.json"),
  JSON.stringify(
    {
      results,
      coverage:
        "Each listed runtime was executed; CI runs separate Node 22/24 jobs",
    },
    null,
    2,
  ),
);
