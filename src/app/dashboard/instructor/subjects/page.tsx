"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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

export default function InstructorSubjectsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <InstructorSubjectsPage />
    </Suspense>
  );
}

function InstructorSubjectsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const selectedSubjectId = searchParams.get("subjectId");

  const [subjects, setSubjects] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [contentForm, setContentForm] = useState({ title: "", description: "", type: "FILE", url: "" });
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

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
    if (selectedSubjectId) {
      fetch(`/api/course-content?subjectId=${selectedSubjectId}`).then(r => r.json()).then(setContent);
      fetch(`/api/attendance?subjectId=${selectedSubjectId}`).then(r => r.json()).then(setAttendance);
    }
  }, [selectedSubjectId]);

  const addContent = async () => {
    await fetch("/api/course-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contentForm, subjectId: selectedSubjectId, uploadedById: user?.id }),
    });
    setShowContentModal(false);
    setContentForm({ title: "", description: "", type: "FILE", url: "" });
    fetch(`/api/course-content?subjectId=${selectedSubjectId}`).then(r => r.json()).then(setContent);
  };

  const saveAttendance = async () => {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: selectedSubjectId,
        instructorId: user?.id,
        records: attendanceRecords,
      }),
    });
    setShowAttendanceModal(false);
    fetch(`/api/attendance?subjectId=${selectedSubjectId}`).then(r => r.json()).then(setAttendance);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : "My Subjects"}
        </h1>
      </div>

      {!selectedSubjectId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(s => (
            <a key={s.id} href={`/dashboard/instructor/subjects?subjectId=${s.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <p className="text-sm text-blue-600 font-mono">{s.code}</p>
                  <CardTitle>{s.name}</CardTitle>
                  <p className="text-sm text-gray-500">{s.units} units</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-3">
            <Button onClick={() => setShowContentModal(true)}>Upload Content</Button>
            <Button
              variant="outline"
              onClick={() => {
                setAttendanceRecords(
                  students
                    .filter(s => s.studentProfile?.status === "ENROLLED_ACTIVE")
                    .map(s => ({ studentId: s.id, status: "PRESENT", date: new Date().toISOString().split("T")[0] }))
                );
                setShowAttendanceModal(true);
              }}
            >
              Log Attendance
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Course Content</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell><Badge>{c.type}</Badge></TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.slice(0, 20).map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.studentId.slice(0, 8)}...</TableCell>
                    <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "PRESENT" ? "success" : a.status === "LATE" ? "warning" : "danger"}>
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <Modal isOpen={showContentModal} onClose={() => setShowContentModal(false)} title="Upload Course Content">
        <div className="space-y-4">
          <Input label="Title" value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})} />
          <Input label="Description" value={contentForm.description} onChange={e => setContentForm({...contentForm, description: e.target.value})} />
          <Select
            label="Type"
            options={[
              { value: "FILE", label: "File" },
              { value: "VIDEO", label: "Video" },
              { value: "LINK", label: "Link" },
            ]}
            value={contentForm.type}
            onChange={e => setContentForm({...contentForm, type: e.target.value})}
          />
          <Input label="URL" placeholder="https://..." value={contentForm.url} onChange={e => setContentForm({...contentForm, url: e.target.value})} />
          <Button onClick={addContent} className="w-full">Upload Content</Button>
        </div>
      </Modal>

      <Modal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title="Log Attendance" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {attendanceRecords.map((record, i) => {
              const student = students.find(s => s.id === record.studentId);
              return (
                <div key={record.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {student?.firstName} {student?.lastName}
                  </span>
                  <Select
                    options={[
                      { value: "PRESENT", label: "Present" },
                      { value: "ABSENT", label: "Absent" },
                      { value: "LATE", label: "Late" },
                      { value: "EXCUSED", label: "Excused" },
                    ]}
                    value={record.status}
                    onChange={e => {
                      const updated = [...attendanceRecords];
                      updated[i].status = e.target.value;
                      setAttendanceRecords(updated);
                    }}
                    className="w-32"
                  />
                </div>
              );
            })}
          </div>
          <Button onClick={saveAttendance} className="w-full">Save Attendance</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
