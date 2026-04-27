"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Subjects", href: "/dashboard/student/subjects", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { label: "My Grades", href: "/dashboard/student/grades", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { label: "Certificates", href: "/dashboard/student/certificates", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
];

export default function StudentDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [participation, setParticipation] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/participation?studentId=${user.id}`)
        .then(r => r.json())
        .then(setParticipation);

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

  const isActive = profile?.status === "ENROLLED_ACTIVE";

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
        <p className="text-gray-500 mt-1">
          {profile?.studentNumber && `Student # ${profile.studentNumber}`}
        </p>
      </div>

      {!isActive && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold text-lg">Access Restricted</h3>
          <p className="text-red-600 mt-1">
            Your payment has not been cleared. Please visit the Cashier to complete your payment
            before accessing course materials.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Status"
          value={isActive ? "Active" : "Pending Payment"}
        />
        <StatsCard
          title="Enrolled Subjects"
          value={enrollment?.subjects?.length || 0}
        />
        <StatsCard
          title="Participation"
          value={`${participation?.participationScore || 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Participation Meter</CardTitle>
            <CardDescription>
              Minimum 75% required to take final exams
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <ProgressBar
              value={participation?.participationScore || 0}
              label="Overall Participation"
              size="lg"
            />
            <ProgressBar
              value={participation?.attendanceRate || 0}
              label="Attendance (60% weight)"
            />
            <ProgressBar
              value={participation?.contentAccessRate || 0}
              label="Content Engagement (40% weight)"
            />
            <div className="pt-2">
              {participation?.canTakeExam ? (
                <Badge variant="success">Eligible for Final Exams</Badge>
              ) : (
                <Badge variant="danger">Below 75% - Exam Locked</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Subjects</CardTitle>
          </CardHeader>
          {isActive ? (
            <div className="space-y-3">
              {enrollment?.subjects?.map((es: any) => (
                <Link
                  key={es.id}
                  href={`/dashboard/student/subjects?subjectId=${es.subject?.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="font-medium text-sm">{es.subject?.name}</p>
                  <p className="text-xs text-gray-500">{es.subject?.code} • {es.subject?.units} units</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete your payment to view subjects.
            </p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
