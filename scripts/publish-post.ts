import fs from "fs";
import path from "path";
import { updateQueueEntry } from "../lib/queue";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npx ts-node scripts/publish-post.ts <slug>");
  process.exit(1);
}

const draftsDir = path.join(process.cwd(), "content", "drafts");
const articlesDir = path.join(process.cwd(), "content", "articles");
const src = path.join(draftsDir, `${slug}.mdx`);
const dest = path.join(articlesDir, `${slug}.mdx`);

if (!fs.existsSync(src)) {
  console.error(`Draft not found: content/drafts/${slug}.mdx`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
updateQueueEntry(slug, {
  status: "published",
  publishedDate: new Date().toISOString(),
});

console.log(`Published: ${slug}`);
console.log(`  ${src} → ${dest}`);
