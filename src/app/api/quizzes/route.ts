import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const type = req.nextUrl.searchParams.get("type");

  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (type) where.type = type;

  const quizzes = await db.quiz.findMany({
    where,
    include: {
      subject: true,
      questions: { orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quizzes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, type, subjectId, createdById, totalPoints, questions, dueDate } = body;

    const quiz = await db.quiz.create({
      data: {
        title,
        type: type || "QUIZ",
        subjectId,
        createdById,
        totalPoints: totalPoints || 100,
        dueDate: dueDate ? new Date(dueDate) : null,
        questions: {
          create: (questions || []).map((q: any, i: number) => ({
            question: q.question,
            type: q.type || "MULTIPLE_CHOICE",
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            points: q.points || 1,
            order: i + 1,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
