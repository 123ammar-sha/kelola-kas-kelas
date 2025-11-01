import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Users,
  FileText
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

async function getDashboardData(userId: string, role: Role) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [totalMasuk, totalKeluar, pendingBills, totalMembers] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: "MASUK",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "KELUAR",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    role === "ANGGOTA"
      ? prisma.bill.count({
          where: {
            userId,
            status: "PENDING",
          },
        })
      : prisma.bill.count({
          where: {
            status: "PENDING",
          },
        }),
    role === "BENDAHARA" || role === "ADMINISTRATOR"
      ? prisma.user.count({
          where: {
            role: "ANGGOTA",
          },
        })
      : 0,
  ]);

  const saldo = (totalMasuk._sum.amount || 0) - (totalKeluar._sum.amount || 0);

  return {
    saldo,
    totalMasuk: totalMasuk._sum.amount || 0,
    totalKeluar: totalKeluar._sum.amount || 0,
    pendingBills,
    totalMembers,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id, session.user.role);

  const stats = [
    {
      title: "Saldo Bulan Ini",
      value: formatCurrency(data.saldo),
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Pemasukan",
      value: formatCurrency(data.totalMasuk),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(data.totalKeluar),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (session.user.role === "ANGGOTA") {
    stats.push({
      title: "Tagihan Pending",
      value: `${data.pendingBills}`,
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    });
  }

  if (session.user.role === "BENDAHARA" || session.user.role === "ADMINISTRATOR") {
    stats.push(
      {
        title: "Total Anggota",
        value: `${data.totalMembers}`,
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Tagihan Pending",
        value: `${data.pendingBills}`,
        icon: FileText,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan keuangan kas kelas Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {session.user.role === "ANGGOTA" && (
          <Card>
            <CardHeader>
              <CardTitle>Tagihan Saya</CardTitle>
              <CardDescription>
                Lihat dan bayar tagihan kas mingguan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {data.pendingBills > 0
                    ? `Ada ${data.pendingBills} tagihan`
                    : "Tidak ada tagihan"}
                </p>
                {data.pendingBills > 0 && (
                  <Link href="/dashboard/tagihan">
                    <Button className="w-full">Lihat Tagihan</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {session.user.role === "BENDAHARA" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Transaksi</CardTitle>
                <CardDescription>
                  Catat pemasukan dan pengeluaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/transaksi">
                  <Button className="w-full">Kelola Transaksi</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Anggota</CardTitle>
                <CardDescription>
                  Kelola anggota kelas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/anggota">
                  <Button className="w-full">Kelola Anggota</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {session.user.role === "ADMINISTRATOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Kelola User</CardTitle>
              <CardDescription>
                Reset password dan kelola pengguna
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/users">
                <Button className="w-full">Kelola User</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
