import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const profile = await db.studentProfile.findUnique({
    where: { userId: studentId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const enrollment = await db.enrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: { subjects: { include: { subject: true } } },
  });

  if (!enrollment) {
    return NextResponse.json({
      participationScore: 0,
      canTakeExam: false,
      message: "No active enrollment found",
    });
  }

  const subjectIds = enrollment.subjects.map((s) => s.subjectId);

  const totalAttendanceDays = await db.attendanceLog.count({
    where: { studentId, subjectId: { in: subjectIds } },
  });

  const presentDays = await db.attendanceLog.count({
    where: {
      studentId,
      subjectId: { in: subjectIds },
      status: { in: ["PRESENT", "LATE"] },
    },
  });

  const attendanceRate = totalAttendanceDays > 0
    ? (presentDays / totalAttendanceDays) * 100
    : 100;

  const totalContent = await db.courseContent.count({
    where: { subjectId: { in: subjectIds } },
  });

  const accessedContent = await db.contentAccessLog.count({
    where: { studentId, content: { subjectId: { in: subjectIds } } },
  });

  const contentAccessRate = totalContent > 0
    ? (accessedContent / totalContent) * 100
    : 100;

  const participationScore = Math.round(
    attendanceRate * 0.6 + contentAccessRate * 0.4
  );

  await db.studentProfile.update({
    where: { userId: studentId },
    data: { participationScore },
  });

  return NextResponse.json({
    participationScore,
    attendanceRate: Math.round(attendanceRate),
    contentAccessRate: Math.round(contentAccessRate),
    canTakeExam: participationScore >= 75,
    totalAttendanceDays,
    presentDays,
    totalContent,
    accessedContent,
  });
}
