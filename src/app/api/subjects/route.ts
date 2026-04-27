import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  const programId = req.nextUrl.searchParams.get("programId");
  const yearLevelId = req.nextUrl.searchParams.get("yearLevelId");

  const where: any = {};
  if (institutionId) where.institutionId = institutionId;
  if (programId) where.programId = programId;
  if (yearLevelId) where.yearLevelId = yearLevelId;

  const subjects = await db.subject.findMany({
    where,
    include: {
      program: true,
      yearLevel: true,
      instructors: { include: { user: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, units, programId, yearLevelId, institutionId } = body;

    const subject = await db.subject.create({
      data: { name, code, units: units || 3, programId, yearLevelId, institutionId },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
