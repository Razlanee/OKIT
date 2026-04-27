import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const body = await req.json();
    const { studentId, answers } = body;

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!studentProfile || studentProfile.status !== "ENROLLED_ACTIVE") {
      return NextResponse.json(
        { error: "Student is not actively enrolled" },
        { status: 403 }
      );
    }

    if (studentProfile.participationScore < 75) {
      return NextResponse.json(
        { error: "Participation score below 75%. Cannot take this assessment." },
        { status: 403 }
      );
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let totalScore = 0;
    for (const question of quiz.questions) {
      const studentAnswer = answers?.[question.id];
      if (
        studentAnswer &&
        studentAnswer.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim()
      ) {
        totalScore += question.points;
      }
    }

    const attempt = await db.quizAttempt.upsert({
      where: {
        quizId_studentId: { quizId, studentId },
      },
      update: {
        answers: JSON.stringify(answers),
        score: totalScore,
        submittedAt: new Date(),
      },
      create: {
        quizId,
        studentId,
        answers: JSON.stringify(answers),
        score: totalScore,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
