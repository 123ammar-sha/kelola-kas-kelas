"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Users,
  FileText,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = {
  ANGGOTA: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tagihan", label: "Tagihan Saya", icon: CreditCard },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
  BENDAHARA: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/transaksi", label: "Transaksi", icon: Wallet },
    { href: "/dashboard/rekap", label: "Rekap", icon: TrendingUp },
    { href: "/dashboard/tagihan", label: "Tagihan", icon: FileText },
    { href: "/dashboard/anggota", label: "Anggota", icon: Users },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
  ADMINISTRATOR: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Kelola User", icon: Users },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "ANGGOTA";
  const menu = menuItems[role];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Kas Kelas</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
