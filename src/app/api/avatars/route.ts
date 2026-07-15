import { NextResponse } from "next/server";
import { listAnimals } from "@/lib/animals";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const offset = Math.max(0, Number(searchParams.get("offset") || 0) || 0);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 48) || 48));

  let animals = await listAnimals();
  if (q) {
    animals = animals.filter(
      (a) =>
        a.species.toLowerCase().includes(q) ||
        a.adjective.toLowerCase().includes(q) ||
        a.nicknameHint.toLowerCase().includes(q) ||
        a.id.includes(q),
    );
  }

  const slice = animals.slice(offset, offset + limit);
  return NextResponse.json({
    total: animals.length,
    offset,
    limit,
    animals: slice,
  });
}
