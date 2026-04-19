import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const body = await request.json().catch(() => ({}));
    if ((body as { secret?: string }).secret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  revalidateTag("queue");
  revalidatePath("/", "layout");
  revalidatePath("/blog", "layout");
  return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
}
