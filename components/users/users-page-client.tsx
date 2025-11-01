"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Wallet, KeyRound, RotateCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersPageClient() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin me-reset password user ini?")) return;

    setResettingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Password berhasil di-reset. Password baru: ${data.newPassword}`);
        fetchUsers();
        router.refresh();
      } else {
        alert("Terjadi kesalahan saat me-reset password");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
    } finally {
      setResettingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <Shield className="h-5 w-5 text-red-600" />;
      case "BENDAHARA":
        return <Wallet className="h-5 w-5 text-blue-600" />;
      default:
        return <Users className="h-5 w-5 text-green-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "Administrator";
      case "BENDAHARA":
        return "Bendahara";
      default:
        return "Anggota";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kelola User</h1>
        <p className="text-muted-foreground">
          Reset password dan kelola semua pengguna
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar User
          </CardTitle>
          <CardDescription>{users.length} user terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada user
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full p-2 bg-muted">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {user.name}
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {getRoleLabel(user.role)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bergabung: {formatDate(new Date(user.createdAt))}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleResetPassword(user.id)}
                    disabled={resettingId === user.id}
                  >
                    {resettingId === user.id ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
