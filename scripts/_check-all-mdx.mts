import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "@mdx-js/mdx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));
const base = process.env.BLOB_PUBLIC_BASE;
if (!base) throw new Error("BLOB_PUBLIC_BASE not set");

const q = await (await fetch(`${base}/queue.json?ts=${Date.now()}`)).json();
const pub = q.filter((e: any) => e.status === "published");
console.log(`Checking ${pub.length} published articles...\n`);

const broken: { slug: string; msg: string; text: string }[] = [];
for (const e of pub) {
  const r = await fetch(`${base}/articles/${e.slug}.mdx?ts=${Date.now()}`);
  if (!r.ok) { console.log(`  ${e.slug}: fetch ${r.status}`); continue; }
  const text = await r.text();
  const body = text.replace(/^---[\s\S]*?---\n/, "");
  try {
    await compile(body, { development: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
    broken.push({ slug: e.slug, msg, text });
    console.log(`BROKEN ${e.slug}: ${msg}`);
  }
}
console.log(`\n${broken.length} broken articles.`);
const outDir = path.join(ROOT, "tmp-broken-mdx");
fs.mkdirSync(outDir, { recursive: true });
for (const b of broken) fs.writeFileSync(path.join(outDir, `${b.slug}.mdx`), b.text);
console.log(`Wrote broken MDX to ${outDir}`);
