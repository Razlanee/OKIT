"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  logo?: string | null;
  accentColor?: string;
  institutionName?: string;
  role: string;
}

export function Sidebar({
  items,
  logo,
  accentColor = "#2563eb",
  institutionName,
  role,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: accentColor }}
            >
              OK
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm">
              {institutionName || "OKIT LTMS"}
            </h1>
            <p className="text-xs text-gray-400 capitalize">
              {role.replace("_", " ").toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                  style={isActive ? { borderLeft: `3px solid ${accentColor}` } : undefined}
                >
                  <span className="w-5 h-5">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          OKIT LTMS v1.0
        </p>
      </div>
    </aside>
  );
}
