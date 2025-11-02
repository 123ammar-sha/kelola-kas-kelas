"use client";

import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-20 md:h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div>
        <h2 className="text-lg md:text-2xl font-bold">
          Selamat datang, {session?.user?.name}!
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {session?.user?.role === "ADMINISTRATOR" && "Administrator"}
          {session?.user?.role === "BENDAHARA" && "Bendahara"}
          {session?.user?.role === "ANGGOTA" && "Anggota Kelas"}
        </p>
      </div>
      <div className="flex items-center gap-4">        
      </div>
    </header>
  );
}