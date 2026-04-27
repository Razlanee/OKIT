import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentCode, amount, method, processedBy, institutionId } = body;

    const enrollment = await db.enrollment.findUnique({
      where: { assessmentCode },
      include: { student: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Invalid assessment code" },
        { status: 404 }
      );
    }

    if (enrollment.status === "ACTIVE" || enrollment.status === "PAID") {
      return NextResponse.json(
        { error: "This enrollment is already paid" },
        { status: 400 }
      );
    }

    if (amount < enrollment.totalAmount) {
      return NextResponse.json(
        { error: `Insufficient payment. Required: ${enrollment.totalAmount}` },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        enrollmentId: enrollment.id,
        institutionId,
        amount: enrollment.totalAmount,
        method: method || "CASH",
        processedBy,
        status: "COMPLETED",
      },
    });

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "ACTIVE" },
    });

    await db.studentProfile.updateMany({
      where: { userId: enrollment.studentId },
      data: { status: "ENROLLED_ACTIVE" },
    });

    const fullPayment = await db.payment.findUnique({
      where: { id: payment.id },
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            program: true,
            subjects: { include: { subject: true } },
          },
        },
      },
    });

    return NextResponse.json(fullPayment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
