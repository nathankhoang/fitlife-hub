import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = await request.json().catch(() => ({})) as { secret?: string; slugs?: string[] };
  if (secret && body.secret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("queue", "max");
  revalidatePath("/", "layout");
  revalidatePath("/blog", "layout");

  // Flush individual article cache tags for newly uploaded slugs
  const slugs: string[] = Array.isArray(body.slugs) ? body.slugs : [];
  for (const slug of slugs) {
    revalidateTag(`article:v2:${slug}`, "max");
    revalidateTag(`draft:v2:${slug}`, "max");
    revalidatePath(`/blog/${slug}`, "page");
  }

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    slugsFlushed: slugs.length,
  });
}
