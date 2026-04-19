import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const { getSocialQueue, updateSocialEntry } = await import("../lib/social/queue.ts");
for (const e of (await getSocialQueue()).filter((x) => x.platform === "instagram" && x.status === "failed")) {
  await updateSocialEntry(e.id, { status: "awaiting_approval", lastError: null });
  console.log(`reset ${e.platform} ${e.id} → awaiting_approval`);
}
