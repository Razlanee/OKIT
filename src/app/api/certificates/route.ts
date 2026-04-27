import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const certificates = await db.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(certificates);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, subjectId } = body;

    const grade = await db.gradebookEntry.findUnique({
      where: { subjectId_studentId: { subjectId, studentId } },
      include: { subject: true },
    });

    if (!grade || !grade.isPassing) {
      return NextResponse.json(
        { error: "Student has not passed this subject" },
        { status: 400 }
      );
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: studentId },
      include: { program: true },
    });

    if (!profile || profile.participationScore < 75) {
      return NextResponse.json(
        { error: "Participation requirements not met" },
        { status: 400 }
      );
    }

    const existing = await db.certificate.findFirst({
      where: { studentId, subjectName: grade.subject.name },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const certificate = await db.certificate.create({
      data: {
        studentId,
        subjectName: grade.subject.name,
        programName: profile.program.name,
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
