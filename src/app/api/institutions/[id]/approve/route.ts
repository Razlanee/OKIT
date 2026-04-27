import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const institution = await db.institution.findUnique({ where: { id } });
    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    const updated = await db.institution.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    const hashedPassword = await hash("changeme123", 12);
    const adminUser = await db.user.create({
      data: {
        email: institution.email,
        password: hashedPassword,
        firstName: "Institution",
        lastName: "Admin",
        role: "ADMIN",
        institutionId: id,
      },
    });

    return NextResponse.json({
      institution: updated,
      adminAccount: {
        email: institution.email,
        temporaryPassword: "changeme123",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
