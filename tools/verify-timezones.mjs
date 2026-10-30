import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
const out = path.resolve(".local/timezone-verification");
await fs.mkdir(out, { recursive: true });
const results = [];
for (const timezone of ["UTC", "Asia/Shanghai", "America/Los_Angeles"]) {
  const base = path.join(out, timezone.replaceAll("/", "-"));
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["tools/verify-generate.mjs", base, JSON.stringify({ few: true })],
      { env: { ...process.env, TZ: timezone }, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`Timezone ${timezone}: ${code}`)),
    );
  });
  const routes = JSON.parse(
    await fs.readFile(path.join(base, "routes.json"), "utf8"),
  );
  if (!routes["field-study"])
    throw Error("Missing generated field-study route");
  for (const route of Object.values(routes))
    await fs.access(path.join(base, "public", route, "index.html"));
  results.push({ timezone, routes, passed: true });
}
await fs.writeFile(
  path.join(out, "report.json"),
  JSON.stringify(results, null, 2),
);
