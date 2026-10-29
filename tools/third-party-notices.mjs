import fs from "node:fs/promises";
import path from "node:path";
const lock = JSON.parse(await fs.readFile("package-lock.json", "utf8"));
const notices = [];
await fs.mkdir("source/licenses", { recursive: true });
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location || !location.startsWith("node_modules/")) continue;
  const file = path.join(location, "package.json");
  let info;
  try {
    info = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    continue;
  }
  const id = info.name + "@" + info.version;
  const files = await fs.readdir(location);
  const license = files.find((name) =>
    /^(licen[cs]e|copying)(\.|$)/i.test(name),
  );
  if (license) {
    const target = id.replaceAll("/", "-").replaceAll("@", "_") + ".txt";
    await fs.copyFile(
      path.join(location, license),
      "source/licenses/" + target,
    );
    notices.push({
      package: id,
      license: info.license || entry.license || "",
      repository: info.repository?.url || info.repository || "",
      notice: target,
    });
  }
}
await fs.copyFile("vendor/gitalk/LICENSE", "source/licenses/gitalk-1.8.0.txt");
notices.push({
  package: "gitalk@1.8.0",
  license: "MIT",
  repository: "https://github.com/gitalk/gitalk",
  notice: "gitalk-1.8.0.txt",
});
await fs.copyFile(
  "vendor/valine-source-v1.5.3.zip",
  "source/licenses/valine-source-v1.5.3.zip",
);
await fs.writeFile(
  "source/licenses/index.json",
  JSON.stringify(notices, null, 2),
);
await fs.writeFile(
  "THIRD-PARTY-NOTICES.md",
  "# Third-party components\n\nHypergraph original code is MIT licensed. Third-party components retain their respective licenses. The distribution includes license texts in `source/licenses/`; `index.json` records versions and upstream repositories. Development dependencies are included in the inventory so it is intentionally broader than any single browser page. Optional clients and graphics libraries load only when used.\n\nValine 1.5.3 is GPL-2.0 and runs as a separately loaded client inside an isolated iframe. Its corresponding upstream source is https://github.com/xcss/Valine/tree/v1.5.3 . LeanCloud Storage retains its own license. Gitalk 1.8.0 is vendored from its npm distribution with its MIT notice. The Barlow Condensed font is distributed under its included font license.\n",
);
console.log("Recorded " + notices.length + " dependency notices.");
