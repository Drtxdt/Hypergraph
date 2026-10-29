import fs from "node:fs/promises";
for (const site of ["blog", "demo", "subdir", "clean-install"]) {
  const file = `.local/${site}/package.json`;
  try {
    const pkg = JSON.parse(await fs.readFile(file, "utf8"));
    delete pkg.dependencies["hexo-renderer-markdown-it"];
    await fs.writeFile(file, JSON.stringify(pkg, null, 2));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
for (const file of ["tools/migrate.mjs", "tools/clean-install.mjs"]) {
  const text = await fs.readFile(file, "utf8");
  await fs.writeFile(
    file,
    text.replace("'hexo-renderer-markdown-it':'^7.1.1',", ""),
  );
}
