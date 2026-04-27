import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function generateStudentNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${year}-${random}`;
}

export function computeFinalGrade(
  quizAvg: number,
  assignmentAvg: number,
  examScore: number
): number {
  return quizAvg * 0.2 + assignmentAvg * 0.3 + examScore * 0.5;
}

export function isPassing(finalGrade: number): boolean {
  return finalGrade >= 75;
}

export function computeParticipationScore(
  attendanceRate: number,
  contentAccessRate: number
): number {
  return attendanceRate * 0.6 + contentAccessRate * 0.4;
}

export function canTakeExam(participationScore: number): boolean {
  return participationScore >= 75;
}
