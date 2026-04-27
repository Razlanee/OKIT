"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard/student", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Subjects", href: "/dashboard/student/subjects", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { label: "My Grades", href: "/dashboard/student/grades", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { label: "Certificates", href: "/dashboard/student/certificates", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
];

export default function CertificatesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [certificates, setCertificates] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/certificates?studentId=${user.id}`)
        .then(r => r.json())
        .then(setCertificates);

      fetch(`/api/gradebook?studentId=${user.id}`)
        .then(r => r.json())
        .then(setGrades);
    }
  }, [user?.id]);

  const generateCertificate = async (subjectId: string) => {
    setGenerating(subjectId);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: user?.id, subjectId }),
    });

    if (res.ok) {
      fetch(`/api/certificates?studentId=${user.id}`)
        .then(r => r.json())
        .then(setCertificates);
    }
    setGenerating(null);
  };

  const eligibleSubjects = grades.filter(g => g.isPassing);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 mt-1">
          Download certificates for passed subjects that meet participation requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Eligible Subjects</CardTitle>
            <CardDescription>
              Click to generate a certificate for subjects you&apos;ve passed.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {eligibleSubjects.length === 0 ? (
              <p className="text-sm text-gray-500">
                Pass your subjects to become eligible for certificates.
              </p>
            ) : (
              eligibleSubjects.map(g => {
                const hasCert = certificates.some(c => c.subjectName === g.subject?.name);
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{g.subject?.name}</p>
                      <p className="text-xs text-gray-500">
                        Final Grade: {g.finalGrade?.toFixed(2)}
                      </p>
                    </div>
                    {hasCert ? (
                      <Badge variant="success">Generated</Badge>
                    ) : (
                      <Button
                        size="sm"
                        loading={generating === g.subjectId}
                        onClick={() => generateCertificate(g.subjectId)}
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Certificates</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <p className="text-sm text-gray-500">No certificates generated yet.</p>
            ) : (
              certificates.map(cert => (
                <div
                  key={cert.id}
                  className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50 text-center"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Certificate of Completion
                  </h3>
                  <p className="text-blue-600 font-semibold mt-1">
                    {cert.subjectName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {cert.programName}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-mono text-gray-400 mt-1">
                    ID: {cert.id.slice(0, 12)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
