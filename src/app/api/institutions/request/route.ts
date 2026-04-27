import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { institutionName, email, phone, address, contactPerson } = body;

    if (!institutionName || !email) {
      return NextResponse.json(
        { error: "Institution name and email are required" },
        { status: 400 }
      );
    }

    const slug = institutionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await db.institution.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "An institution with this name already exists" },
        { status: 409 }
      );
    }

    const institution = await db.institution.create({
      data: {
        name: institutionName,
        slug,
        email,
        phone: phone || null,
        address: address || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(institution, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const institutions = await db.institution.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(institutions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
