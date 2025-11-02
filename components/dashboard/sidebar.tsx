"use client";

import { useState } from "react";
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
  KeyRound,
  Menu,
  X
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
    { href: "/dashboard/users", label: "Kelola User", icon: KeyRound },
    { href: "/dashboard/anggota", label: "Anggota", icon: Users },
    { href: "/dashboard/transaksi", label: "Transaksi", icon: Wallet },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "ANGGOTA";
  const menu = menuItems[role];
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <>
      {/* Mobile Toggle Button - Fixed Position */}
      <button
        className="fixed bottom-12 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg md:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Overlay when sidebar is open on mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
          "fixed md:sticky top-0 inset-y-0 left-0 z-40 flex flex-col w-52 md:w-64 bg-card border-r transition-transform duration-300 ease-in-out h-screen overflow-y-auto", // added sticky, height and overflow
          "md:translate-x-0",
          isCollapsed ? "-translate-x-full" : "translate-x-0"
     )}>
        <div className="flex h-12 md:h-16 items-center border-b px-4 md:px-6 sticky top-0 bg-card z-10"> {/* added sticky header */}
          <h1 className="text-base md:text-xl font-bold text-primary">Kas Kelas</h1>
        </div>

        <nav className="flex-1 space-y-0.5 md:space-y-1 p-2 md:p-4 overflow-y-auto"> {/* added overflow */}
    {menu.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsCollapsed(true)}
          className={cn(
            "flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors", // reduced spacing
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" /> {/* smaller icons */}
          {item.label}
        </Link>
      );
    })}
  </nav>

        <div className="border-t p-4 sticky bottom-0 bg-card"> {/* added sticky footer */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}