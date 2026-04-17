import fs from "fs";
import path from "path";
import { updateQueueEntry } from "../lib/queue";

async function main() {
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
  await updateQueueEntry(slug, {
    status: "published",
    publishedDate: new Date().toISOString(),
  });

  console.log(`Published: ${slug}`);
  console.log(`  ${src} → ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
