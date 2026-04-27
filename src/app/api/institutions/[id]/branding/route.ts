import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { logoUrl, accentColor } = body;

    const institution = await db.institution.update({
      where: { id },
      data: {
        ...(logoUrl !== undefined && { logoUrl }),
        ...(accentColor !== undefined && { accentColor }),
      },
    });

    return NextResponse.json(institution);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
