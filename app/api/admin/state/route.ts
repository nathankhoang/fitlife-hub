import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATE_PATH = path.join(process.cwd(), "data", "telemetry", "state.json");

function readState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}

export async function GET() {
  const state = readState();
  if (!state) return NextResponse.json({ error: "state.json not found" }, { status: 404 });
  return NextResponse.json(state);
}

export async function PATCH(req: NextRequest) {
  const patch = await req.json();
  const state = readState() ?? {};
  const updated = { ...state, ...patch };
  fs.writeFileSync(STATE_PATH, JSON.stringify(updated, null, 2));
  return NextResponse.json(updated);
}
