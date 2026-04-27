"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "Branding", href: "/dashboard/admin/branding", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
  { label: "Academic Hierarchy", href: "/dashboard/admin/hierarchy", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { label: "Fees & Tuition", href: "/dashboard/admin/fees", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { label: "Staff Management", href: "/dashboard/admin/staff", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

export default function StaffPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const institutionId = user?.institutionId;

  const [staff, setStaff] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "changeme123", firstName: "", lastName: "", role: "INSTRUCTOR", subjectIds: [] as string[],
  });

  useEffect(() => {
    if (institutionId) {
      fetchStaff();
      fetch(`/api/subjects?institutionId=${institutionId}`).then(r => r.json()).then(setSubjects);
    }
  }, [institutionId]);

  const fetchStaff = async () => {
    const res = await fetch(`/api/users?institutionId=${institutionId}`);
    const data = await res.json();
    setStaff(data.filter((u: any) => u.role !== "STUDENT"));
  };

  const createStaff = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, institutionId }),
    });
    setShowModal(false);
    setForm({ email: "", password: "changeme123", firstName: "", lastName: "", role: "INSTRUCTOR", subjectIds: [] });
    fetchStaff();
  };

  const roleColors: Record<string, "info" | "success" | "warning" | "danger"> = {
    ADMIN: "info",
    OPERATOR: "success",
    CASHIER: "warning",
    INSTRUCTOR: "danger",
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-500 mt-1">Create and manage Operators, Cashiers, and Instructors.</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Add Staff Member</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Subjects</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell><Badge variant={roleColors[s.role] || "default"}>{s.role}</Badge></TableCell>
                <TableCell>
                  {s.assignedSubjects?.length > 0
                    ? s.assignedSubjects.map((a: any) => a.subject?.name).join(", ")
                    : "-"}
                </TableCell>
                <TableCell><Badge variant={s.isActive ? "success" : "danger"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Staff Member" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
            <Input label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Input label="Temporary Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <Select
            label="Role"
            options={[
              { value: "OPERATOR", label: "Operator" },
              { value: "CASHIER", label: "Cashier" },
              { value: "INSTRUCTOR", label: "Instructor" },
            ]}
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}
          />
          {form.role === "INSTRUCTOR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.subjectIds.includes(s.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({...form, subjectIds: [...form.subjectIds, s.id]});
                        } else {
                          setForm({...form, subjectIds: form.subjectIds.filter(id => id !== s.id)});
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {s.code} - {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button onClick={createStaff} className="w-full">Create Staff Account</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
