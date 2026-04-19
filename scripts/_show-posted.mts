import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue } = await import("../lib/social/queue.ts");
for (const e of (await getSocialQueue()).filter((x) => x.status === "posted")) {
  console.log(`${e.platform}  id=${e.platformPostId}`);
  console.log(`  ${e.platformPostUrl}`);
  console.log(`  posted=${e.postedAt}`);
}
