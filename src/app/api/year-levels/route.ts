import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const yearLevels = await db.yearLevel.findMany({
    where: { institutionId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(yearLevels);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, order, institutionId } = body;

    const yearLevel = await db.yearLevel.create({
      data: { name, order, institutionId },
    });

    return NextResponse.json(yearLevel, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
