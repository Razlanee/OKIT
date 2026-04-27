import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "OPERATOR"
  | "CASHIER"
  | "INSTRUCTOR"
  | "STUDENT";

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role as Role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }

  return session;
}

export function getRoleDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    SUPER_ADMIN: "/dashboard/super-admin",
    ADMIN: "/dashboard/admin",
    OPERATOR: "/dashboard/operator",
    CASHIER: "/dashboard/cashier",
    INSTRUCTOR: "/dashboard/instructor",
    STUDENT: "/dashboard/student",
  };
  return paths[role] || "/login";
}
