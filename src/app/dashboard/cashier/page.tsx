"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
    label: "Payments",
    href: "/dashboard/cashier",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
];

export default function CashierDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const institutionId = user?.institutionId;

  const [payments, setPayments] = useState<any[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState({ assessmentCode: "", amount: "", method: "CASH" });
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (institutionId) fetchPayments();
  }, [institutionId]);

  const fetchPayments = async () => {
    const res = await fetch(`/api/payments?institutionId=${institutionId}`);
    setPayments(await res.json());
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError("");
    const res = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentCode: processForm.assessmentCode,
        amount: parseFloat(processForm.amount),
        method: processForm.method,
        processedBy: (user as any)?.id,
        institutionId,
      }),
    });
    const data = await res.json();
    setProcessing(false);
    if (res.ok) {
      setReceipt(data);
      setShowProcessModal(false);
      setProcessForm({ assessmentCode: "", amount: "", method: "CASH" });
      fetchPayments();
    } else {
      setError(data.error || "Payment failed");
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
            <p className="text-gray-500 mt-1">Accept payments, verify assessment codes, issue receipts.</p>
          </div>
          <Button onClick={() => setShowProcessModal(true)}>Process Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard title="Total Payments" value={payments.length} />
        <StatsCard title="Total Collected" value={formatCurrency(totalCollected)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Payment Records</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.receiptNumber?.slice(0, 8)}</TableCell>
                <TableCell className="font-medium">
                  {p.enrollment?.student?.firstName} {p.enrollment?.student?.lastName}
                </TableCell>
                <TableCell>{p.enrollment?.program?.name}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                <TableCell><Badge>{p.method}</Badge></TableCell>
                <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant="success">{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} title="Process Payment">
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <Input
            label="Assessment Code"
            placeholder="Enter the code from the assessment slip"
            value={processForm.assessmentCode}
            onChange={e => setProcessForm({...processForm, assessmentCode: e.target.value})}
          />
          <Input
            label="Amount Received (PHP)"
            type="number"
            step="0.01"
            value={processForm.amount}
            onChange={e => setProcessForm({...processForm, amount: e.target.value})}
          />
          <Select
            label="Payment Method"
            options={[
              { value: "CASH", label: "Cash" },
              { value: "GCASH", label: "GCash" },
              { value: "MAYA", label: "Maya" },
              { value: "CARD", label: "Card" },
            ]}
            value={processForm.method}
            onChange={e => setProcessForm({...processForm, method: e.target.value})}
          />
          <Button onClick={handleProcess} loading={processing} className="w-full">
            Confirm Payment & Issue Receipt
          </Button>
        </div>
      </Modal>

      {receipt && (
        <Modal isOpen onClose={() => setReceipt(null)} title="Official Receipt" size="lg">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">OFFICIAL RECEIPT</h3>
              <p className="text-sm text-gray-500">{user?.institutionName}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Receipt #:</strong> {receipt.receiptNumber}</p>
              <p><strong>Reference #:</strong> {receipt.referenceNumber}</p>
              <p><strong>Student:</strong> {receipt.enrollment?.student?.firstName} {receipt.enrollment?.student?.lastName}</p>
              <p><strong>Program:</strong> {receipt.enrollment?.program?.name}</p>
              <p><strong>Amount:</strong> {formatCurrency(receipt.amount)}</p>
              <p><strong>Method:</strong> {receipt.method}</p>
              <p><strong>Date:</strong> {new Date(receipt.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Subjects Enrolled:</h4>
              {receipt.enrollment?.subjects?.map((es: any) => (
                <p key={es.id} className="text-sm">{es.subject?.code} - {es.subject?.name}</p>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-green-600 font-semibold">
              STATUS: ENROLLED - ACTIVE
            </p>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.print()} className="w-full">
              Print Receipt
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
