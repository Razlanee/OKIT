import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const programs = await db.program.findMany({
    where: { institutionId },
    include: { department: true, yearLevels: { include: { yearLevel: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, departmentId, institutionId, totalUnits } = body;

    const program = await db.program.create({
      data: { name, code, departmentId, institutionId, totalUnits: totalUnits || 0 },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
