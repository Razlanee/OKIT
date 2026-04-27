import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const fees = await db.miscFee.findMany({
    where: { institutionId, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(fees);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, institutionId } = body;

    const fee = await db.miscFee.create({
      data: { name, amount, institutionId },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
