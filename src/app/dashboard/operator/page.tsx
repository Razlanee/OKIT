"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const navItems = [
  {
    label: "Enrollment",
    href: "/dashboard/operator",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  },
];

export default function OperatorDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const institutionId = user?.institutionId;

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [yearLevels, setYearLevels] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState<any>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", programId: "", yearLevelId: "",
  });

  useEffect(() => {
    if (institutionId) {
      fetchEnrollments();
      fetch(`/api/programs?institutionId=${institutionId}`).then(r => r.json()).then(setPrograms);
      fetch(`/api/year-levels?institutionId=${institutionId}`).then(r => r.json()).then(setYearLevels);
    }
  }, [institutionId]);

  const fetchEnrollments = async () => {
    const res = await fetch(`/api/enrollments?institutionId=${institutionId}`);
    setEnrollments(await res.json());
  };

  const handleEnroll = async () => {
    setLoading(true);
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, institutionId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setNewEnrollment(data);
      setShowModal(false);
      setForm({ firstName: "", lastName: "", email: "", programId: "", yearLevelId: "" });
      fetchEnrollments();
    }
  };

  const pendingCount = enrollments.filter(e => e.status === "ASSESSED" || e.status === "PENDING").length;
  const activeCount = enrollments.filter(e => e.status === "ACTIVE").length;

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Enrollment</h1>
            <p className="text-gray-500 mt-1">Register students and generate assessment slips.</p>
          </div>
          <Button onClick={() => setShowModal(true)}>New Enrollment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Enrollments" value={enrollments.length} />
        <StatsCard title="Pending Payment" value={pendingCount} />
        <StatsCard title="Active Students" value={activeCount} />
      </div>

      <Card>
        <CardHeader><CardTitle>Enrollment Records</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Year Level</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Assessment Code</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.student?.firstName} {e.student?.lastName}</TableCell>
                <TableCell>{e.program?.name}</TableCell>
                <TableCell>{e.yearLevel?.name}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(e.totalAmount)}</TableCell>
                <TableCell className="font-mono text-xs">{e.assessmentCode?.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Badge variant={
                    e.status === "ACTIVE" ? "success" :
                    e.status === "ASSESSED" ? "warning" : "default"
                  }>{e.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Student Enrollment" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
            <Input label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Select
            label="Program"
            options={programs.map(p => ({ value: p.id, label: p.name }))}
            value={form.programId}
            onChange={e => setForm({...form, programId: e.target.value})}
            placeholder="Select program"
          />
          <Select
            label="Year Level"
            options={yearLevels.map(y => ({ value: y.id, label: y.name }))}
            value={form.yearLevelId}
            onChange={e => setForm({...form, yearLevelId: e.target.value})}
            placeholder="Select year level"
          />
          <p className="text-sm text-gray-500">
            The system will auto-populate subjects and compute the tuition total based on locked rates.
          </p>
          <Button onClick={handleEnroll} loading={loading} className="w-full">
            Register & Generate Assessment Slip
          </Button>
        </div>
      </Modal>

      {newEnrollment && (
        <Modal
          isOpen
          onClose={() => setNewEnrollment(null)}
          title="Assessment Slip Generated"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">ASSESSMENT SLIP</h3>
                <p className="text-sm text-gray-500">{user?.institutionName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Student:</strong> {newEnrollment.student?.firstName} {newEnrollment.student?.lastName}</p>
                <p><strong>Program:</strong> {newEnrollment.program?.name}</p>
                <p><strong>Year Level:</strong> {newEnrollment.yearLevel?.name}</p>
                <p><strong>Total Units:</strong> {newEnrollment.totalUnits}</p>
              </div>
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Subjects:</h4>
                {newEnrollment.subjects?.map((es: any) => (
                  <p key={es.id} className="text-sm">{es.subject?.code} - {es.subject?.name} ({es.subject?.units} units)</p>
                ))}
              </div>
              <div className="mt-4 border-t pt-4 space-y-1 text-sm">
                <p>Tuition: {formatCurrency(newEnrollment.tuitionAmount)}</p>
                <p>Misc Fees: {formatCurrency(newEnrollment.miscFeesAmount)}</p>
                <p className="text-lg font-bold">Total: {formatCurrency(newEnrollment.totalAmount)}</p>
              </div>
              <div className="mt-4 border-t pt-4 text-center">
                <p className="text-xs text-gray-500">Assessment Code:</p>
                <p className="font-mono font-bold text-lg">{newEnrollment.assessmentCode}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.print()} className="w-full">
              Print Assessment Slip
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
