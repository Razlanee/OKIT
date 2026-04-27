"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Subjects", href: "/dashboard/student/subjects", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { label: "My Grades", href: "/dashboard/student/grades", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { label: "Certificates", href: "/dashboard/student/certificates", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
];

export default function StudentSubjectsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <StudentSubjectsPage />
    </Suspense>
  );
}

function StudentSubjectsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const selectedSubjectId = searchParams.get("subjectId");

  const [enrollment, setEnrollment] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/enrollments?studentId=${user.id}&status=ACTIVE`)
        .then(r => r.json())
        .then(data => setEnrollment(data[0]));

      fetch(`/api/users?institutionId=${user.institutionId}&role=STUDENT`)
        .then(r => r.json())
        .then(students => {
          const me = students.find((s: any) => s.id === user.id);
          setProfile(me?.studentProfile);
        });
    }
  }, [user?.id, user?.institutionId]);

  useEffect(() => {
    if (selectedSubjectId && profile?.status === "ENROLLED_ACTIVE") {
      fetch(`/api/course-content?subjectId=${selectedSubjectId}`)
        .then(r => r.json())
        .then(setContent);
    }
  }, [selectedSubjectId, profile?.status]);

  const isActive = profile?.status === "ENROLLED_ACTIVE";

  if (!isActive) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold">Access Restricted</h3>
          <p className="text-red-600 mt-1">
            Complete your payment to access course materials.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
      </div>

      {!selectedSubjectId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollment?.subjects?.map((es: any) => (
            <a key={es.id} href={`/dashboard/student/subjects?subjectId=${es.subject?.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <p className="text-sm text-blue-600 font-mono">{es.subject?.code}</p>
                  <CardTitle>{es.subject?.name}</CardTitle>
                  <p className="text-sm text-gray-500">{es.subject?.units} units</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Course Materials</CardTitle>
          </CardHeader>
          {content.length === 0 ? (
            <p className="text-sm text-gray-500">No content uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell><Badge>{c.type}</Badge></TableCell>
                    <TableCell>{c.uploadedBy?.firstName} {c.uploadedBy?.lastName}</TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {c.type === "VIDEO" ? "Watch" : "Download"}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}
