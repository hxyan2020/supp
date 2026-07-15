import { NextResponse } from "next/server";
import { BACKGROUND_PHOTOS } from "@/lib/backgrounds";

export async function GET() {
  return NextResponse.json({ backgrounds: BACKGROUND_PHOTOS });
}
