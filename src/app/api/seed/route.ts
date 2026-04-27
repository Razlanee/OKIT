import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const existing = await db.user.findUnique({
      where: { email: "superadmin@okit.com" },
    });

    if (existing) {
      return NextResponse.json({ message: "Seed data already exists" });
    }

    const hashedPassword = await hash("admin123", 12);

    await db.user.create({
      data: {
        email: "superadmin@okit.com",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
    });

    const institution = await db.institution.create({
      data: {
        name: "Metro Manila Technical Institute",
        slug: "mmti",
        email: "admin@mmti.edu.ph",
        phone: "+63 912 345 6789",
        address: "123 Education Ave, Manila",
        status: "ACTIVE",
        accentColor: "#2563eb",
      },
    });

    const adminUser = await db.user.create({
      data: {
        email: "admin@mmti.edu.ph",
        password: hashedPassword,
        firstName: "Maria",
        lastName: "Santos",
        role: "ADMIN",
        institutionId: institution.id,
      },
    });

    const operator = await db.user.create({
      data: {
        email: "operator@mmti.edu.ph",
        password: hashedPassword,
        firstName: "Juan",
        lastName: "Dela Cruz",
        role: "OPERATOR",
        institutionId: institution.id,
      },
    });

    const cashier = await db.user.create({
      data: {
        email: "cashier@mmti.edu.ph",
        password: hashedPassword,
        firstName: "Ana",
        lastName: "Reyes",
        role: "CASHIER",
        institutionId: institution.id,
      },
    });

    const dept = await db.department.create({
      data: {
        name: "College of Information Technology",
        code: "CIT",
        institutionId: institution.id,
      },
    });

    const program = await db.program.create({
      data: {
        name: "Bachelor of Science in Information Technology",
        code: "BSIT",
        departmentId: dept.id,
        institutionId: institution.id,
        totalUnits: 160,
      },
    });

    const yearLevel = await db.yearLevel.create({
      data: {
        name: "1st Year",
        order: 1,
        institutionId: institution.id,
      },
    });

    await db.programYearLevel.create({
      data: {
        programId: program.id,
        yearLevelId: yearLevel.id,
      },
    });

    const subjects = await Promise.all([
      db.subject.create({
        data: {
          name: "Introduction to Computing",
          code: "IT101",
          units: 3,
          programId: program.id,
          yearLevelId: yearLevel.id,
          institutionId: institution.id,
        },
      }),
      db.subject.create({
        data: {
          name: "Programming Fundamentals",
          code: "IT102",
          units: 3,
          programId: program.id,
          yearLevelId: yearLevel.id,
          institutionId: institution.id,
        },
      }),
      db.subject.create({
        data: {
          name: "Web Development Basics",
          code: "IT103",
          units: 3,
          programId: program.id,
          yearLevelId: yearLevel.id,
          institutionId: institution.id,
        },
      }),
    ]);

    const instructor = await db.user.create({
      data: {
        email: "instructor@mmti.edu.ph",
        password: hashedPassword,
        firstName: "Pedro",
        lastName: "Garcia",
        role: "INSTRUCTOR",
        institutionId: institution.id,
      },
    });

    for (const subj of subjects) {
      await db.instructorSubject.create({
        data: { userId: instructor.id, subjectId: subj.id },
      });
    }

    await db.tuitionRate.create({
      data: {
        ratePerUnit: 500,
        institutionId: institution.id,
        isLocked: true,
      },
    });

    await db.miscFee.create({
      data: {
        name: "Laboratory Fee",
        amount: 2000,
        institutionId: institution.id,
      },
    });

    await db.miscFee.create({
      data: {
        name: "Library Fee",
        amount: 500,
        institutionId: institution.id,
      },
    });

    const studentUser = await db.user.create({
      data: {
        email: "student@mmti.edu.ph",
        password: hashedPassword,
        firstName: "Carlo",
        lastName: "Mendoza",
        role: "STUDENT",
        institutionId: institution.id,
      },
    });

    await db.studentProfile.create({
      data: {
        userId: studentUser.id,
        studentNumber: "2026-00001",
        programId: program.id,
        yearLevelId: yearLevel.id,
        status: "ENROLLED_ACTIVE",
        participationScore: 82,
      },
    });

    const enrollment = await db.enrollment.create({
      data: {
        studentId: studentUser.id,
        programId: program.id,
        yearLevelId: yearLevel.id,
        institutionId: institution.id,
        academicPeriod: "2026-2027 1st Semester",
        totalUnits: 9,
        tuitionAmount: 4500,
        miscFeesAmount: 2500,
        totalAmount: 7000,
        status: "ACTIVE",
      },
    });

    for (const subj of subjects) {
      await db.enrollmentSubject.create({
        data: { enrollmentId: enrollment.id, subjectId: subj.id },
      });
    }

    await db.payment.create({
      data: {
        enrollmentId: enrollment.id,
        institutionId: institution.id,
        amount: 7000,
        method: "CASH",
        processedBy: cashier.id,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      message: "Seed data created successfully",
      credentials: {
        superAdmin: "superadmin@okit.com / admin123",
        admin: "admin@mmti.edu.ph / admin123",
        operator: "operator@mmti.edu.ph / admin123",
        cashier: "cashier@mmti.edu.ph / admin123",
        instructor: "instructor@mmti.edu.ph / admin123",
        student: "student@mmti.edu.ph / admin123",
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
