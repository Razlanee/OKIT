import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get("institutionId");

  const where: any = {};
  if (institutionId) where.institutionId = institutionId;

  const payments = await db.payment.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          program: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}
