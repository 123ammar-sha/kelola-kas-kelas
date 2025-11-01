// ...existing code...
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Bill {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  status: string;
  batchId: string | null;
  user: {
    name: string;
    email: string;
  };
}

interface BillGroup {
  batchId: string;
  description: string;
  dueDate: string;
  totalAmount: number;
  pendingCount: number;
  claimedCount: number;
  paidCount: number;
  bills: Bill[];
}

export function TagihanPageClient({ role }: { role: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    dueDate: "",
    autoCreate: false,
    weeksCount: "4",
  });

  // <-- tambahan state untuk search -->
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch("/api/bills");
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role !== "BENDAHARA") return;

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: formData.description,
          dueDate: formData.dueDate,
          weeksCount: formData.autoCreate ? formData.weeksCount : 1,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ amount: "", description: "", dueDate: "", autoCreate: false, weeksCount: "4" });
        fetchBills();
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || "Terjadi kesalahan");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat membuat tagihan");
    }
  };

  const handleClaimPaid = async (billId: string) => {
    if (role !== "ANGGOTA") return;
    
    if (!confirm("Konfirmasi: Anda sudah membayar tagihan ini?")) return;
    
    try {
      const res = await fetch(`/api/bills/${billId}/claim-paid`, {
        method: "POST",
      });

      if (res.ok) {
        fetchBills();
        router.refresh();
      } else {
        alert("Terjadi kesalahan");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
    }
  };

  const handlePay = async (billId: string) => {
    if (role !== "BENDAHARA") return;
    
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
      });

      if (res.ok) {
        fetchBills();
        router.refresh();
      } else {
        alert("Terjadi kesalahan saat verifikasi pembayaran");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
    }
  };

  // filter bills berdasarkan searchQuery (nama anggota)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBills = normalizedQuery
    ? bills.filter((b) => (b.user?.name || "").toLowerCase().includes(normalizedQuery))
    : bills;

  // Group bills by batchId for bendahara (gunakan filteredBills)
  const groupedBills: BillGroup[] = role === "BENDAHARA" 
    ? filteredBills.reduce((acc, bill) => {
        const batchId = bill.batchId || bill.id;
        const existing = acc.find(g => g.batchId === batchId);
        
        if (existing) {
          existing.bills.push(bill);
          existing.totalAmount += bill.amount;
          if (bill.status === "PENDING") existing.pendingCount++;
          else if (bill.status === "CLAIMED_PAID") existing.claimedCount++;
          else if (bill.status === "PAID") existing.paidCount++;
        } else {
          acc.push({
            batchId,
            description: bill.description,
            dueDate: bill.dueDate,
            totalAmount: bill.amount,
            pendingCount: bill.status === "PENDING" ? 1 : 0,
            claimedCount: bill.status === "CLAIMED_PAID" ? 1 : 0,
            paidCount: bill.status === "PAID" ? 1 : 0,
            bills: [bill],
          });
        }
        return acc;
      }, [] as BillGroup[])
    : [];

  const pendingBills = filteredBills.filter((b) => b.status === "PENDING");
  const claimedBills = filteredBills.filter((b) => b.status === "CLAIMED_PAID");
  const paidBills = filteredBills.filter((b) => b.status === "PAID");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tagihan</h1>
          <p className="text-muted-foreground">
            {role === "BENDAHARA"
              ? "Kelola tagihan kas mingguan untuk semua anggota"
              : "Lihat dan klaim status tagihan Anda"}
          </p>
        </div>
        {role === "BENDAHARA" && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Tagihan
          </Button>
        )}
      </div>
      

      {showForm && role === "BENDAHARA" && (
        <Card>
          <CardHeader>            
            <CardTitle>Buat Tagihan Baru</CardTitle>
            <CardDescription>
              Tagihan akan dibuat untuk SEMUA anggota kelas secara otomatis
            </CardDescription>            
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
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
                  placeholder="Kas minggu ke-1"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Jatuh Tempo</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoCreate"
                    checked={formData.autoCreate}
                    onChange={(e) =>
                      setFormData({ ...formData, autoCreate: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="autoCreate" className="cursor-pointer">
                    Auto buat untuk beberapa minggu ke depan
                  </Label>
                </div>
                {formData.autoCreate && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="weeksCount" className="whitespace-nowrap">
                      Buat untuk:
                    </Label>
                    <Input
                      id="weeksCount"
                      type="number"
                      value={formData.weeksCount}
                      onChange={(e) =>
                        setFormData({ ...formData, weeksCount: e.target.value })
                      }
                      min="1"
                      max="12"
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">minggu</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ amount: "", description: "", dueDate: "", autoCreate: false, weeksCount: "4" });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>            
          </CardContent>
        </Card>
      )}

      {role === "ANGGOTA" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Tagihan Pending
              </CardTitle>
              <CardDescription>{pendingBills.length} tagihan</CardDescription>
            </CardHeader>            
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(
                  pendingBills.reduce((sum, b) => sum + b.amount, 0)
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Menunggu Verifikasi
              </CardTitle>
              <CardDescription>{claimedBills.length} tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(
                  claimedBills.reduce((sum, b) => sum + b.amount, 0)
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tagihan Lunas
              </CardTitle>
              <CardDescription>{paidBills.length} tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(
                  paidBills.reduce((sum, b) => sum + b.amount, 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {role === "BENDAHARA" ? (
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Pembayaran</CardTitle>            
            <CardDescription>
              Verifikasi pembayaran yang sudah diklaim anggota
            </CardDescription>
            {/* Search bar: cari berdasarkan nama anggota */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Cari nama anggota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        {searchQuery && (
          <Button variant="ghost" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        )}
      </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat...</div>
            ) : groupedBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada tagihan
              </div>
            ) : (
              <div className="space-y-8">
                {groupedBills.map((group) => (
                  <div key={group.batchId} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h3 className="text-lg font-bold">{group.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Jatuh tempo: {formatDate(new Date(group.dueDate))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(group.totalAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {group.pendingCount} pending / {group.claimedCount} menunggu / {group.paidCount} lunas
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {group.bills.map((bill) => (
                        <div
                          key={bill.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            bill.status === "CLAIMED_PAID" ? "bg-blue-50 border-blue-200" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                bill.status === "PENDING"
                                  ? "bg-orange-100"
                                  : bill.status === "CLAIMED_PAID"
                                  ? "bg-blue-100"
                                  : "bg-green-100"
                              }`}
                            >
                              {bill.status === "PENDING" ? (
                                <Clock className="h-4 w-4 text-orange-600" />
                              ) : bill.status === "CLAIMED_PAID" ? (
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {bill.user.name}
                                {bill.status === "CLAIMED_PAID" && (
                                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded animate-pulse">
                                    Menunggu Verifikasi
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {bill.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold">
                              {formatCurrency(bill.amount)}
                            </p>
                            {bill.status === "PENDING" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePay(bill.id)}
                              >
                                Verifikasi
                              </Button>
                            ) : bill.status === "CLAIMED_PAID" ? (
                              <Button
                                size="sm"
                                onClick={() => handlePay(bill.id)}
                              >
                                Verifikasi
                              </Button>
                            ) : (
                              <span className="text-sm text-green-600 font-medium">
                                Lunas
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tagihan Saya</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat...</div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada tagihan
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      bill.status === "PENDING" ? "border-orange-500" :
                      bill.status === "CLAIMED_PAID" ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full p-2 ${
                          bill.status === "PENDING"
                            ? "bg-orange-100"
                            : bill.status === "CLAIMED_PAID"
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        {bill.status === "PENDING" ? (
                          <Clock className="h-5 w-5 text-orange-600" />
                        ) : bill.status === "CLAIMED_PAID" ? (
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{bill.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Jatuh tempo: {formatDate(new Date(bill.dueDate))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(bill.amount)}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            bill.status === "PENDING"
                              ? "text-orange-600"
                              : bill.status === "CLAIMED_PAID"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {bill.status === "PENDING" && "Belum Lunas"}
                          {bill.status === "CLAIMED_PAID" && "Menunggu Verifikasi"}
                          {bill.status === "PAID" && "Lunas"}
                        </p>
                      </div>
                      {bill.status === "PENDING" && (
                        <Button onClick={() => handleClaimPaid(bill.id)}>
                          Sudah Bayar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
// ...existing code...