import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ExportButton } from "@/components/rekap/export-button";

async function getRekapData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get all transactions
  const [allTransactions, billsData] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.bill.findMany({
      where: {
        status: "PAID",
        updatedAt: { gte: startOfMonth },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Group transactions by description pattern (same description = same batch)
  const groupedTransactions = allTransactions.reduce((acc, t) => {
    // Extract description prefix (before " - Name")
    const prefix = t.description.split(" - ")[0];
    
    if (!acc[prefix]) {
      acc[prefix] = [];
    }
    acc[prefix].push(t);
    return acc;
  }, {} as Record<string, typeof allTransactions>);

  const masuk = allTransactions.filter((t) => t.type === "MASUK");
  const keluar = allTransactions.filter((t) => t.type === "KELUAR");

  const totalMasuk = masuk.reduce((sum, t) => sum + t.amount, 0);
  const totalKeluar = keluar.reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalMasuk - totalKeluar;

  return { 
    masuk, 
    keluar, 
    totalMasuk, 
    totalKeluar, 
    saldo,
    groupedTransactions: Object.entries(groupedTransactions)
      .map(([description, transactions]) => ({
        description,
        transactions,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        count: transactions.length,
      }))
      .filter(g => g.transactions.some(t => t.type === "MASUK")),
  };
}

export default async function RekapPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BENDAHARA") {
    redirect("/dashboard");
  }

  const data = await getRekapData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rekap Keuangan</h1>
          <p className="text-muted-foreground">
            Laporan lengkap pemasukan dan pengeluaran kas
          </p>
        </div>
        <ExportButton />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <div className="rounded-full p-2 bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalMasuk)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <div className="rounded-full p-2 bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalKeluar)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Transactions (Tagihan yang sudah dibayar) */}
      {data.groupedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Masuk</CardTitle>
            <CardDescription>
              Detail transaksi masuk dan tagihan per batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {data.groupedTransactions.map((group, idx) => (
                <div key={idx} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg">{group.description}</h4>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {group.count} pembayaran
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(group.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-4">
                    {group.transactions
                      .filter(t => t.type === "MASUK")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 px-3 bg-green-50 rounded"                          
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {t.user.name} {/* Nama anggota ditampilkan di sini */}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t.description} - {formatDate(new Date(t.createdAt))}
                            </span>
                          </div>
                          <span className="font-bold text-green-600">
                            +{formatCurrency(t.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Transactions */}
      <div className="">
        {/* <Card>
          <CardHeader>
            <CardTitle>Transaksi Masuk Lainnya</CardTitle>
            <CardDescription>Pemasukan selain dari tagihan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {data.masuk.filter(
                t => !t.description.includes(" - ") || 
                !data.groupedTransactions.some(g => 
                  g.transactions.some(gt => gt.id === t.id)
                )
              ).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Tidak ada transaksi lainnya
                </p>
              ) : (
                data.masuk
                  .filter(
                    t => !data.groupedTransactions.some(g => 
                      g.transactions.some(gt => gt.id === t.id)
                    )
                  )
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(t.createdAt))}
                        </p>
                      </div>
                      <p className="font-bold text-green-600">
                        +{formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran</CardTitle>
            <CardDescription>Detail semua pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {data.keluar.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Tidak ada pengeluaran
                </p>
              ) : (
                data.keluar.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(t.createdAt))}
                      </p>
                    </div>
                    <p className="font-bold text-red-600">
                      -{formatCurrency(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
