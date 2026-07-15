import { NextResponse } from "next/server";
import {
  ensureSessionUser,
  publicUser,
  updateProfile,
} from "@/lib/user-auth";

export async function GET() {
  try {
    const user = await ensureSessionUser();
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await ensureSessionUser();
    const body = (await req.json()) as {
      nickname?: string;
      avatarAnimalId?: string;
    };
    const updated = await updateProfile(user.id, body);
    return NextResponse.json({ user: publicUser(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "User not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
