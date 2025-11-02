"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Trash2,
  Edit,
  Search,
  X
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface Transaction {
  id: string;
  amount: number;
  type: "MASUK" | "KELUAR";
  description: string;
  createdAt: string;
}

export function TransactionPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // State untuk search

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/transactions/${editingId}`
        : "/api/transactions";
      
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          type: formType,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ amount: "", description: "" });
        fetchTransactions();
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || "Terjadi kesalahan");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan transaksi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTransactions();
        router.refresh();
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus transaksi");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormType(transaction.type);
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
    });
    setShowForm(true);
  };

  // Filter transactions berdasarkan search query
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      formatDate(new Date(transaction.createdAt)).toLowerCase().includes(searchLower) ||
      transaction.type.toLowerCase().includes(searchLower) ||
      formatCurrency(transaction.amount).toLowerCase().includes(searchLower)
    );
  });

  const totalMasuk = transactions
    .filter((t) => t.type === "MASUK")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalKeluar = transactions
    .filter((t) => t.type === "KELUAR")
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalMasuk - totalKeluar;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground">
            Catat pemasukan dan pengeluaran kas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Transaksi" : "Tambah Transaksi Baru"}
            </CardTitle>
            <CardDescription>
              Pilih jenis transaksi dan isi informasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formType === "MASUK" ? "default" : "outline"}
                  onClick={() => setFormType("MASUK")}
                  className="flex-1"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Pemasukan
                </Button>
                <Button
                  type="button"
                  variant={formType === "KELUAR" ? "default" : "outline"}
                  onClick={() => setFormType("KELUAR")}
                  className="flex-1"
                >
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Pengeluaran
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Keterangan</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Masukkan keterangan transaksi"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Perbarui" : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ amount: "", description: "" });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              {formatCurrency(totalMasuk)}
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
              {formatCurrency(totalKeluar)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <div className="rounded-full p-2 bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Semua transaksi yang telah dicatat
          </CardDescription>
          {/* Search Bar */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan keterangan, tanggal, atau jumlah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Tidak ada transaksi yang cocok dengan pencarian" : "Belum ada transaksi"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-full p-2 ${
                        transaction.type === "MASUK"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {transaction.type === "MASUK" ? (
                        <TrendingUp
                          className={`h-5 w-5 ${
                            transaction.type === "MASUK"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(transaction.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === "MASUK"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "MASUK" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}