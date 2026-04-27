import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");
  const role = req.nextUrl.searchParams.get("role");

  const where: any = {};
  if (institutionId) where.institutionId = institutionId;
  if (role) where.role = role;

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      institutionId: true,
      createdAt: true,
      studentProfile: true,
      assignedSubjects: { include: { subject: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, role, institutionId, subjectIds } = body;

    const allowedRoles = ["ADMIN", "OPERATOR", "CASHIER", "INSTRUCTOR", "STUDENT"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await hash(password || "changeme123", 12);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        institutionId,
      },
    });

    if (role === "INSTRUCTOR" && subjectIds?.length) {
      for (const subjectId of subjectIds) {
        await db.instructorSubject.create({
          data: { userId: user.id, subjectId },
        });
      }
    }

    return NextResponse.json(
      { ...user, password: undefined },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
