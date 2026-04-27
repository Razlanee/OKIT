import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const studentId = req.nextUrl.searchParams.get("studentId");

  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (studentId) where.studentId = studentId;

  const entries = await db.gradebookEntry.findMany({
    where,
    include: { subject: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, studentId, instructorId, quizAverage, assignmentAverage, examScore } = body;

    const finalGrade =
      (quizAverage || 0) * 0.2 +
      (assignmentAverage || 0) * 0.3 +
      (examScore || 0) * 0.5;

    const entry = await db.gradebookEntry.upsert({
      where: {
        subjectId_studentId: { subjectId, studentId },
      },
      update: {
        quizAverage: quizAverage || 0,
        assignmentAverage: assignmentAverage || 0,
        examScore: examScore || 0,
        finalGrade,
        isPassing: finalGrade >= 75,
        instructorId,
      },
      create: {
        subjectId,
        studentId,
        instructorId,
        quizAverage: quizAverage || 0,
        assignmentAverage: assignmentAverage || 0,
        examScore: examScore || 0,
        finalGrade,
        isPassing: finalGrade >= 75,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
