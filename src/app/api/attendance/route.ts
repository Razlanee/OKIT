import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const studentId = req.nextUrl.searchParams.get("studentId");

  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (studentId) where.studentId = studentId;

  const logs = await db.attendanceLog.findMany({
    where,
    include: { subject: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, records, instructorId } = body;

    const results = [];
    for (const record of records) {
      const log = await db.attendanceLog.upsert({
        where: {
          subjectId_studentId_date: {
            subjectId,
            studentId: record.studentId,
            date: new Date(record.date || new Date().toISOString().split("T")[0]),
          },
        },
        update: { status: record.status },
        create: {
          subjectId,
          studentId: record.studentId,
          instructorId,
          status: record.status,
          date: new Date(record.date || new Date().toISOString().split("T")[0]),
        },
      });
      results.push(log);
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
