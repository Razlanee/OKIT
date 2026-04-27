"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard/super-admin",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

interface Institution {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  createdAt: string;
  subscriptionPlan: string;
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState<Institution | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    const res = await fetch("/api/institutions/request");
    const data = await res.json();
    setInstitutions(data);
    setLoading(false);
  };

  const handleApprove = async (institution: Institution) => {
    setApproving(true);
    await fetch(`/api/institutions/${institution.id}/approve`, {
      method: "POST",
    });
    setApproving(false);
    setApproveModal(null);
    fetchInstitutions();
  };

  const activeCount = institutions.filter((i) => i.status === "ACTIVE").length;
  const pendingCount = institutions.filter((i) => i.status === "PENDING").length;

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Platform Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Manage institutional accounts and monitor platform health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Institutions"
          value={institutions.length}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatsCard
          title="Active Institutions"
          value={activeCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Requests"
          value={pendingCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institutional Accounts</CardTitle>
        </CardHeader>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.name}</TableCell>
                  <TableCell>{inst.email}</TableCell>
                  <TableCell>{inst.subscriptionPlan}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inst.status === "ACTIVE"
                          ? "success"
                          : inst.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {inst.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {inst.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => setApproveModal(inst)}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {approveModal && (
        <Modal
          isOpen
          onClose={() => setApproveModal(null)}
          title="Approve Institution"
        >
          <p className="text-gray-600 mb-4">
            Approve <strong>{approveModal.name}</strong> and create their Admin
            account? A payment link will be sent to {approveModal.email}.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setApproveModal(null)}>
              Cancel
            </Button>
            <Button
              loading={approving}
              onClick={() => handleApprove(approveModal)}
            >
              Approve & Activate
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
