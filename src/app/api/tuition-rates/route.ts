import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const rates = await db.tuitionRate.findMany({
    where: { institutionId },
    orderBy: { effectiveFrom: "desc" },
  });

  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ratePerUnit, institutionId } = body;

    const rate = await db.tuitionRate.create({
      data: { ratePerUnit, institutionId, isLocked: true },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
