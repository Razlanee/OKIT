"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Subjects", href: "/dashboard/student/subjects", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { label: "My Grades", href: "/dashboard/student/grades", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { label: "Certificates", href: "/dashboard/student/certificates", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
];

export default function StudentGradesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/gradebook?studentId=${user.id}`)
        .then(r => r.json())
        .then(setGrades);
    }
  }, [user?.id]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
        <p className="text-gray-500 mt-1">
          Formula: 20% Quizzes + 30% Assignments + 50% Exams
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Report</CardTitle>
          <CardDescription>Passing grade: 75%</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Quizzes (20%)</TableHead>
              <TableHead>Assignments (30%)</TableHead>
              <TableHead>Exam (50%)</TableHead>
              <TableHead>Final Grade</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.subject?.name}</TableCell>
                <TableCell>{g.quizAverage?.toFixed(1)}</TableCell>
                <TableCell>{g.assignmentAverage?.toFixed(1)}</TableCell>
                <TableCell>{g.examScore?.toFixed(1)}</TableCell>
                <TableCell className="font-bold">{g.finalGrade?.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={g.isPassing ? "success" : "danger"}>
                    {g.isPassing ? "PASSED" : "FAILED"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {grades.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No grades posted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}
