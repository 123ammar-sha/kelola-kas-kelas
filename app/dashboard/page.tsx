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
  FileText,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

async function getDashboardData(userId: string, role: Role) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalMasuk, 
    totalKeluar, 
    pendingBills, 
    totalMembers,
    upcomingBills
  ] = await Promise.all([
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
    // Get upcoming bills (within next 7 days)
    prisma.bill.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    }),
  ]);

  const saldo = (totalMasuk._sum.amount || 0) - (totalKeluar._sum.amount || 0);

  return {
    saldo,
    totalMasuk: totalMasuk._sum.amount || 0,
    totalKeluar: totalKeluar._sum.amount || 0,
    pendingBills,
    totalMembers,
    upcomingBills,
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Ringkasan keuangan kas kelas Anda
          </p>
        </div>
        {session.user.role === "BENDAHARA" && (
          <Link href="/dashboard/rekap">
            <Button variant="outline" className="w-full sm:w-auto">
              Lihat Rekap
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Left Column - Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          {session.user.role === "ANGGOTA" && (
            <Card>
              <CardHeader>
                <CardTitle>Tagihan Saya</CardTitle>
                <CardDescription>
                  Lihat dan bayar tagihan kas mingguan Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-lg font-semibold">
                    {data.pendingBills > 0
                      ? `Ada ${data.pendingBills} tagihan menunggu`
                      : "Tidak ada tagihan"}
                  </p>
                </div>
                {data.pendingBills > 0 && (
                  <Link href="/dashboard/tagihan">
                    <Button className="w-full">Lihat Tagihan</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {session.user.role === "BENDAHARA" && (
            <div className="space-y-4">
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
            </div>
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

        {/* Right Column - Upcoming Bills */}
        {(session.user.role === "BENDAHARA" || session.user.role === "ADMINISTRATOR") && (
          <Card className="lg:col-span-1 xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tagihan Jatuh Tempo</CardTitle>
                <CardDescription>
                  Tagihan yang akan jatuh tempo dalam 7 hari ke depan
                </CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {data.upcomingBills.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada tagihan yang akan jatuh tempo</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {data.upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="font-medium text-sm truncate">
                            {bill.user?.name || "Tidak ada nama"}
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(bill.amount)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {bill.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Jatuh tempo: {formatDate(bill.dueDate!)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard/tagihan">
                  <Button variant="outline" className="w-full">
                    Lihat Semua Tagihan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* For ANGGOTA role, show full width upcoming bills */}
        {session.user.role === "ANGGOTA" && data.upcomingBills.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tagihan Mendatang</CardTitle>
              <CardDescription>
                Tagihan Anda yang akan jatuh tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingBills
                  .filter(bill => bill.userId === session.user.id)
                  .map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="font-medium text-sm">{bill.description}</p>
                          <p className="text-sm font-semibold text-orange-600">
                            {formatCurrency(bill.amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Jatuh tempo: {formatDate(bill.dueDate!)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}