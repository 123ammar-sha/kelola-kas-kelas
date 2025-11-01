"use client";

import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h2 className="text-2xl font-bold">
          Selamat datang, {session?.user?.name}!
        </h2>
        <p className="text-sm text-muted-foreground">
          {session?.user?.role === "ADMINISTRATOR" && "Administrator"}
          {session?.user?.role === "BENDAHARA" && "Bendahara"}
          {session?.user?.role === "ANGGOTA" && "Anggota Kelas"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
