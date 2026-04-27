import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateStudentNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  const studentId = req.nextUrl.searchParams.get("studentId");
  const status = req.nextUrl.searchParams.get("status");

  const where: any = {};
  if (institutionId) where.institutionId = institutionId;
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;

  const enrollments = await db.enrollment.findMany({
    where,
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, email: true, studentProfile: true },
      },
      program: true,
      yearLevel: true,
      subjects: { include: { subject: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      programId,
      yearLevelId,
      institutionId,
      academicPeriod,
    } = body;

    const rate = await db.tuitionRate.findFirst({
      where: { institutionId },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!rate) {
      return NextResponse.json(
        { error: "No tuition rate configured" },
        { status: 400 }
      );
    }

    const subjects = await db.subject.findMany({
      where: { programId, yearLevelId, institutionId },
    });

    const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
    const tuitionAmount = totalUnits * rate.ratePerUnit;

    const miscFees = await db.miscFee.findMany({
      where: { institutionId, isActive: true },
    });
    const miscFeesAmount = miscFees.reduce((sum, f) => sum + f.amount, 0);
    const totalAmount = tuitionAmount + miscFeesAmount;

    let studentUser = await db.user.findUnique({ where: { email } });

    if (!studentUser) {
      const hashedPassword = await hash("student123", 12);
      studentUser = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "STUDENT",
          institutionId,
        },
      });

      await db.studentProfile.create({
        data: {
          userId: studentUser.id,
          studentNumber: generateStudentNumber(),
          programId,
          yearLevelId,
          status: "PENDING",
        },
      });
    }

    const enrollment = await db.enrollment.create({
      data: {
        studentId: studentUser.id,
        programId,
        yearLevelId,
        institutionId,
        academicPeriod: academicPeriod || `${new Date().getFullYear()}-${new Date().getFullYear() + 1} 1st Semester`,
        totalUnits,
        tuitionAmount,
        miscFeesAmount,
        totalAmount,
        status: "ASSESSED",
      },
    });

    for (const subj of subjects) {
      await db.enrollmentSubject.create({
        data: { enrollmentId: enrollment.id, subjectId: subj.id },
      });
    }

    const fullEnrollment = await db.enrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        program: true,
        yearLevel: true,
        subjects: { include: { subject: true } },
      },
    });

    return NextResponse.json(fullEnrollment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
