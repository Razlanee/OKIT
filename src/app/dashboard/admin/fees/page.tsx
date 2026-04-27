"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "Branding", href: "/dashboard/admin/branding", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
  { label: "Academic Hierarchy", href: "/dashboard/admin/hierarchy", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { label: "Fees & Tuition", href: "/dashboard/admin/fees", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { label: "Staff Management", href: "/dashboard/admin/staff", icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

export default function FeesPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const institutionId = user?.institutionId;

  const [tuitionRates, setTuitionRates] = useState<any[]>([]);
  const [miscFees, setMiscFees] = useState<any[]>([]);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [rateForm, setRateForm] = useState({ ratePerUnit: "" });
  const [feeForm, setFeeForm] = useState({ name: "", amount: "" });

  useEffect(() => {
    if (institutionId) fetchAll();
  }, [institutionId]);

  const fetchAll = async () => {
    const [rates, fees] = await Promise.all([
      fetch(`/api/tuition-rates?institutionId=${institutionId}`).then(r => r.json()),
      fetch(`/api/misc-fees?institutionId=${institutionId}`).then(r => r.json()),
    ]);
    setTuitionRates(rates);
    setMiscFees(fees);
  };

  const createRate = async () => {
    await fetch("/api/tuition-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratePerUnit: parseFloat(rateForm.ratePerUnit), institutionId }),
    });
    setShowRateModal(false);
    setRateForm({ ratePerUnit: "" });
    fetchAll();
  };

  const createFee = async () => {
    await fetch("/api/misc-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: feeForm.name, amount: parseFloat(feeForm.amount), institutionId }),
    });
    setShowFeeModal(false);
    setFeeForm({ name: "", amount: "" });
    fetchAll();
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fees & Tuition</h1>
        <p className="text-gray-500 mt-1">Set locked tuition rates and miscellaneous fees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tuition Rate per Unit</CardTitle>
                <CardDescription>Once set, rates are locked and cannot be modified by other roles.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowRateModal(true)}>Set Rate</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Rate/Unit</TableHead><TableHead>Effective From</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {tuitionRates.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{formatCurrency(r.ratePerUnit)}</TableCell>
                  <TableCell>{new Date(r.effectiveFrom).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={r.isLocked ? "info" : "default"}>{r.isLocked ? "Locked" : "Draft"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Miscellaneous Fees</CardTitle>
                <CardDescription>Standard fees applied to all enrollments.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowFeeModal(true)}>Add Fee</Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Fee Name</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {miscFees.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.name}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(f.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} title="Set Tuition Rate">
        <div className="space-y-4">
          <Input label="Rate per Unit (PHP)" type="number" step="0.01" value={rateForm.ratePerUnit} onChange={e => setRateForm({ ratePerUnit: e.target.value })} />
          <Button onClick={createRate} className="w-full">Set & Lock Rate</Button>
        </div>
      </Modal>

      <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Add Miscellaneous Fee">
        <div className="space-y-4">
          <Input label="Fee Name" value={feeForm.name} onChange={e => setFeeForm({...feeForm, name: e.target.value})} />
          <Input label="Amount (PHP)" type="number" step="0.01" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} />
          <Button onClick={createFee} className="w-full">Add Fee</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
