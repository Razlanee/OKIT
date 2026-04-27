import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.data;

    if (!event) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const type = event.attributes?.type;

    if (type === "payment.paid") {
      const paymentData = event.attributes?.data;
      const metadata = paymentData?.attributes?.metadata;

      if (metadata?.institutionId) {
        await db.institution.update({
          where: { id: metadata.institutionId },
          data: {
            status: "ACTIVE",
            subscriptionEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
