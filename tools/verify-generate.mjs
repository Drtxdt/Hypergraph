import { generate } from "./verify/fixture.mjs";
import path from "node:path";
await generate(
  path.resolve(process.argv[2]),
  JSON.parse(process.argv[3] || "{}"),
);
console.log("Generated " + process.argv[2]);
