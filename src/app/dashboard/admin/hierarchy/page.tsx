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

const navItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "Branding", href: "/dashboard/admin/branding", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
  { label: "Academic Hierarchy", href: "/dashboard/admin/hierarchy", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { label: "Fees & Tuition", href: "/dashboard/admin/fees", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { label: "Staff Management", href: "/dashboard/admin/staff", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

export default function HierarchyPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const institutionId = user?.institutionId;

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [yearLevels, setYearLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showProgModal, setShowProgModal] = useState(false);
  const [showYLModal, setShowYLModal] = useState(false);
  const [showSubjModal, setShowSubjModal] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [progForm, setProgForm] = useState({ name: "", code: "", departmentId: "", totalUnits: "" });
  const [ylForm, setYlForm] = useState({ name: "", order: "" });
  const [subjForm, setSubjForm] = useState({ name: "", code: "", units: "3", programId: "", yearLevelId: "" });

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    const [d, p, y, s] = await Promise.all([
      fetch(`/api/departments?institutionId=${institutionId}`).then(r => r.json()),
      fetch(`/api/programs?institutionId=${institutionId}`).then(r => r.json()),
      fetch(`/api/year-levels?institutionId=${institutionId}`).then(r => r.json()),
      fetch(`/api/subjects?institutionId=${institutionId}`).then(r => r.json()),
    ]);
    setDepartments(d);
    setPrograms(p);
    setYearLevels(y);
    setSubjects(s);
  };

  const createDept = async () => {
    await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...deptForm, institutionId }),
    });
    setShowDeptModal(false);
    setDeptForm({ name: "", code: "" });
    fetchAll();
  };

  const createProg = async () => {
    await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...progForm, totalUnits: parseInt(progForm.totalUnits) || 0, institutionId }),
    });
    setShowProgModal(false);
    setProgForm({ name: "", code: "", departmentId: "", totalUnits: "" });
    fetchAll();
  };

  const createYL = async () => {
    await fetch("/api/year-levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ylForm, order: parseInt(ylForm.order) || 1, institutionId }),
    });
    setShowYLModal(false);
    setYlForm({ name: "", order: "" });
    fetchAll();
  };

  const createSubj = async () => {
    await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...subjForm, units: parseInt(subjForm.units) || 3, institutionId }),
    });
    setShowSubjModal(false);
    setSubjForm({ name: "", code: "", units: "3", programId: "", yearLevelId: "" });
    fetchAll();
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Academic Hierarchy</h1>
        <p className="text-gray-500 mt-1">Build your curriculum: Departments → Programs → Year Levels → Subjects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Departments</CardTitle>
              <Button size="sm" onClick={() => setShowDeptModal(true)}>Add</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead></TableRow></TableHeader>
            <TableBody>
              {departments.map(d => (
                <TableRow key={d.id}><TableCell className="font-mono">{d.code}</TableCell><TableCell>{d.name}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Programs</CardTitle>
              <Button size="sm" onClick={() => setShowProgModal(true)}>Add</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead></TableRow></TableHeader>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}><TableCell className="font-mono">{p.code}</TableCell><TableCell>{p.name}</TableCell><TableCell>{p.department?.name}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Year Levels</CardTitle>
              <Button size="sm" onClick={() => setShowYLModal(true)}>Add</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Name</TableHead></TableRow></TableHeader>
            <TableBody>
              {yearLevels.map(y => (
                <TableRow key={y.id}><TableCell>{y.order}</TableCell><TableCell>{y.name}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Subjects</CardTitle>
              <Button size="sm" onClick={() => setShowSubjModal(true)}>Add</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Units</TableHead></TableRow></TableHeader>
            <TableBody>
              {subjects.map(s => (
                <TableRow key={s.id}><TableCell className="font-mono">{s.code}</TableCell><TableCell>{s.name}</TableCell><TableCell>{s.units}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <div className="space-y-4">
          <Input label="Department Name" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
          <Input label="Code" placeholder="e.g., CIT" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} />
          <Button onClick={createDept} className="w-full">Create Department</Button>
        </div>
      </Modal>

      <Modal isOpen={showProgModal} onClose={() => setShowProgModal(false)} title="Add Program">
        <div className="space-y-4">
          <Input label="Program Name" value={progForm.name} onChange={e => setProgForm({...progForm, name: e.target.value})} />
          <Input label="Code" placeholder="e.g., BSIT" value={progForm.code} onChange={e => setProgForm({...progForm, code: e.target.value})} />
          <Select label="Department" options={departments.map(d => ({ value: d.id, label: d.name }))} value={progForm.departmentId} onChange={e => setProgForm({...progForm, departmentId: e.target.value})} placeholder="Select department" />
          <Input label="Total Units" type="number" value={progForm.totalUnits} onChange={e => setProgForm({...progForm, totalUnits: e.target.value})} />
          <Button onClick={createProg} className="w-full">Create Program</Button>
        </div>
      </Modal>

      <Modal isOpen={showYLModal} onClose={() => setShowYLModal(false)} title="Add Year Level">
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g., 1st Year" value={ylForm.name} onChange={e => setYlForm({...ylForm, name: e.target.value})} />
          <Input label="Order" type="number" value={ylForm.order} onChange={e => setYlForm({...ylForm, order: e.target.value})} />
          <Button onClick={createYL} className="w-full">Create Year Level</Button>
        </div>
      </Modal>

      <Modal isOpen={showSubjModal} onClose={() => setShowSubjModal(false)} title="Add Subject">
        <div className="space-y-4">
          <Input label="Subject Name" value={subjForm.name} onChange={e => setSubjForm({...subjForm, name: e.target.value})} />
          <Input label="Code" placeholder="e.g., IT101" value={subjForm.code} onChange={e => setSubjForm({...subjForm, code: e.target.value})} />
          <Input label="Units" type="number" value={subjForm.units} onChange={e => setSubjForm({...subjForm, units: e.target.value})} />
          <Select label="Program" options={programs.map(p => ({ value: p.id, label: p.name }))} value={subjForm.programId} onChange={e => setSubjForm({...subjForm, programId: e.target.value})} placeholder="Select program" />
          <Select label="Year Level" options={yearLevels.map(y => ({ value: y.id, label: y.name }))} value={subjForm.yearLevelId} onChange={e => setSubjForm({...subjForm, yearLevelId: e.target.value})} placeholder="Select year level" />
          <Button onClick={createSubj} className="w-full">Create Subject</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
