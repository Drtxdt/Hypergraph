import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
const file = ".local/completion/_config.hypergraph.yml";
const original = await fs.readFile(file, "utf8");
const generate = () => {
  const result = spawnSync(
    process.execPath,
    ["tools/generate-site.mjs", ".local/completion"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw Error(result.stdout + result.stderr);
};
try {
  for (const preset of ["industrial", "ledger", "reading"]) {
    await fs.writeFile(
      file,
      yaml.dump({
        preset,
        comments: { enable: false },
        appearance: { show_cover: true },
      }),
    );
    generate();
    await fs.copyFile(
      ".local/completion/public/index.html",
      `.local/visual-${preset}.html`,
    );
  }
} finally {
  await fs.writeFile(file, original);
  generate();
}
console.log("Prepared three actual rendered preset pages.");
