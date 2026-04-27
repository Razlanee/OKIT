"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: "Branding",
    href: "/dashboard/admin/branding",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  },
  {
    label: "Academic Hierarchy",
    href: "/dashboard/admin/hierarchy",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    label: "Fees & Tuition",
    href: "/dashboard/admin/fees",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: "Staff Management",
    href: "/dashboard/admin/staff",
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [stats, setStats] = useState({ departments: 0, programs: 0, subjects: 0, staff: 0, students: 0 });

  useEffect(() => {
    if (!user?.institutionId) return;
    const iid = user.institutionId;

    Promise.all([
      fetch(`/api/departments?institutionId=${iid}`).then((r) => r.json()),
      fetch(`/api/programs?institutionId=${iid}`).then((r) => r.json()),
      fetch(`/api/subjects?institutionId=${iid}`).then((r) => r.json()),
      fetch(`/api/users?institutionId=${iid}&role=INSTRUCTOR`).then((r) => r.json()),
      fetch(`/api/users?institutionId=${iid}&role=STUDENT`).then((r) => r.json()),
    ]).then(([depts, progs, subjs, instructors, students]) => {
      setStats({
        departments: depts.length,
        programs: progs.length,
        subjects: subjs.length,
        staff: instructors.length,
        students: students.length,
      });
    });
  }, [user?.institutionId]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Institution Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Configure your institution&apos;s academic structure, branding, and staff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatsCard title="Departments" value={stats.departments} />
        <StatsCard title="Programs" value={stats.programs} />
        <StatsCard title="Subjects" value={stats.subjects} />
        <StatsCard title="Instructors" value={stats.staff} />
        <StatsCard title="Students" value={stats.students} />
      </div>
    </DashboardLayout>
  );
}
