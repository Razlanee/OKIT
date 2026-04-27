"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard/instructor", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Subjects", href: "/dashboard/instructor/subjects", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { label: "Gradebook", href: "/dashboard/instructor/gradebook", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
];

export default function GradebookPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({ studentId: "", quizAverage: "", assignmentAverage: "", examScore: "" });

  useEffect(() => {
    if (user?.institutionId) {
      fetch(`/api/subjects?institutionId=${user.institutionId}`)
        .then(r => r.json())
        .then(allSubjects => {
          const mine = allSubjects.filter((s: any) =>
            s.instructors?.some((i: any) => i.userId === user.id)
          );
          setSubjects(mine);
        });

      fetch(`/api/users?institutionId=${user.institutionId}&role=STUDENT`)
        .then(r => r.json())
        .then(setStudents);
    }
  }, [user?.institutionId, user?.id]);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/gradebook?subjectId=${selectedSubject}`)
        .then(r => r.json())
        .then(setGrades);
    }
  }, [selectedSubject]);

  const saveGrade = async () => {
    await fetch("/api/gradebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: selectedSubject,
        studentId: gradeForm.studentId,
        instructorId: user?.id,
        quizAverage: parseFloat(gradeForm.quizAverage) || 0,
        assignmentAverage: parseFloat(gradeForm.assignmentAverage) || 0,
        examScore: parseFloat(gradeForm.examScore) || 0,
      }),
    });
    setShowGradeModal(false);
    setGradeForm({ studentId: "", quizAverage: "", assignmentAverage: "", examScore: "" });
    fetch(`/api/gradebook?subjectId=${selectedSubject}`).then(r => r.json()).then(setGrades);
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-500 mt-1">
          Input raw scores. Formula: <strong>20% Quizzes + 30% Assignments + 50% Exams</strong>
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          label="Select Subject"
          options={subjects.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          placeholder="Choose a subject"
          className="max-w-md"
        />
        {selectedSubject && (
          <div className="flex items-end">
            <Button onClick={() => setShowGradeModal(true)}>Add/Update Grade</Button>
          </div>
        )}
      </div>

      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Records</CardTitle>
            <CardDescription>Final grade = 20% Quiz + 30% Assignment + 50% Exam. Passing = 75%</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Quiz Avg (20%)</TableHead>
                <TableHead>Assignment Avg (30%)</TableHead>
                <TableHead>Exam Score (50%)</TableHead>
                <TableHead>Final Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map(g => {
                const student = students.find(s => s.id === g.studentId);
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">
                      {student ? `${student.firstName} ${student.lastName}` : g.studentId.slice(0, 8)}
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title="Enter Student Grades">
        <div className="space-y-4">
          <Select
            label="Student"
            options={students.filter(s => s.studentProfile?.status === "ENROLLED_ACTIVE").map(s => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName}`,
            }))}
            value={gradeForm.studentId}
            onChange={e => setGradeForm({...gradeForm, studentId: e.target.value})}
            placeholder="Select student"
          />
          <Input
            label="Quiz Average (out of 100)"
            type="number"
            min="0" max="100"
            value={gradeForm.quizAverage}
            onChange={e => setGradeForm({...gradeForm, quizAverage: e.target.value})}
          />
          <Input
            label="Assignment Average (out of 100)"
            type="number"
            min="0" max="100"
            value={gradeForm.assignmentAverage}
            onChange={e => setGradeForm({...gradeForm, assignmentAverage: e.target.value})}
          />
          <Input
            label="Exam Score (out of 100)"
            type="number"
            min="0" max="100"
            value={gradeForm.examScore}
            onChange={e => setGradeForm({...gradeForm, examScore: e.target.value})}
          />
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium">Grading Formula (Locked):</p>
            <p>Final = (Quiz × 0.20) + (Assignment × 0.30) + (Exam × 0.50)</p>
          </div>
          <Button onClick={saveGrade} className="w-full">Save Grade</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
