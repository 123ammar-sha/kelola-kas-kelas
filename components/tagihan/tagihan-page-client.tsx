"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CreditCard, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  User, 
  Search, 
  X, 
  ChevronDown,
  ChevronUp,
  Filter,
  Undo2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Bill {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  status: string;
  batchId: string | null;
  user: {
    id: string;
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

interface User {
  id: string;
  name: string;
  email: string;
}

export function TagihanPageClient({ role }: { role: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    dueDate: "",
    autoCreate: false,
    weeksCount: "4",
    selectedUsers: [] as string[],
    forAllUsers: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showVerified, setShowVerified] = useState(false);

  useEffect(() => {
    fetchBills();
    if (role === "BENDAHARA") {
      fetchUsers();
    }
  }, [role]);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
          weeksCount: formData.autoCreate ? parseInt(formData.weeksCount) : 1,
          userIds: formData.forAllUsers ? [] : formData.selectedUsers,
          forAllUsers: formData.forAllUsers,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ 
          amount: "", 
          description: "", 
          dueDate: "", 
          autoCreate: false, 
          weeksCount: "4",
          selectedUsers: [],
          forAllUsers: true 
        });
        setUserSearchQuery("");
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

  // FUNGSI UNVERIFY - DITAMBAHKAN DI SINI
  const handleUnverify = async (billId: string) => {
    if (role !== "BENDAHARA") return;
    
    if (!confirm("Apakah Anda yakin ingin membatalkan verifikasi tagihan ini? Status akan dikembalikan ke 'Menunggu Verifikasi'.")) return;
    
    try {
      const res = await fetch(`/api/bills/${billId}/unverify`, {
        method: "POST",
      });

      if (res.ok) {
        fetchBills();
        router.refresh();
      } else {
        alert("Terjadi kesalahan saat membatalkan verifikasi");
      }
    } catch (error) {
      alert("Terjadi kesalahan");
    }
  };

  // Filter bills berdasarkan searchQuery
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBills = normalizedQuery
    ? bills.filter((b) => (b.user?.name || "").toLowerCase().includes(normalizedQuery))
    : bills;

  // Group bills by batchId
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

  // Pisahkan grup yang aktif dan yang sudah terverifikasi semua
  const activeGroupedBills = groupedBills.filter(group => 
    group.pendingCount > 0 || group.claimedCount > 0
  );

  const verifiedGroupedBills = groupedBills.filter(group => 
    group.pendingCount === 0 && group.claimedCount === 0
  );

  // Filter users untuk pilihan anggota
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Urutkan tagihan
  const sortedIndividualBills = [...filteredBills].sort((a, b) => 
    a.user.name.localeCompare(b.user.name)
  );

  const sortedActiveGroups = [...activeGroupedBills].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const sortedVerifiedGroups = [...verifiedGroupedBills].sort((a, b) => 
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  const pendingBills = filteredBills.filter((b) => b.status === "PENDING");
  const claimedBills = filteredBills.filter((b) => b.status === "CLAIMED_PAID");
  const paidBills = filteredBills.filter((b) => b.status === "PAID");

  const allBillsPaid = bills.length > 0 && bills.every(bill => bill.status === "PAID");

  // Toggle expand/collapse group
  const toggleGroup = (batchId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedGroups(newExpanded);
  };

  // Toggle select user
  const toggleUserSelection = (userId: string) => {
    if (formData.selectedUsers.includes(userId)) {
      setFormData({
        ...formData,
        selectedUsers: formData.selectedUsers.filter(id => id !== userId)
      });
    } else {
      setFormData({
        ...formData,
        selectedUsers: [...formData.selectedUsers, userId]
      });
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tagihan</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {role === "BENDAHARA"
              ? "Kelola tagihan kas untuk anggota"
              : "Lihat dan klaim status tagihan Anda"}
          </p>
        </div>
        {role === "BENDAHARA" && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Buat Tagihan
          </Button>
        )}
      </div>

      {/* Form Buat Tagihan */}
      {showForm && role === "BENDAHARA" && (
        <Card>
          <CardHeader>            
            <CardTitle>Buat Tagihan Baru</CardTitle>
            <CardDescription>
              {formData.forAllUsers 
                ? "Tagihan akan dibuat untuk SEMUA anggota kelas" 
                : `Tagihan untuk ${formData.selectedUsers.length} anggota terpilih`
              }
            </CardDescription>            
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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

              {/* Pilihan Target Tagihan */}
              <div className="space-y-3">
                <Label>Target Tagihan</Label>
                <div className="flex flex-col sm:flex-row sm:gap-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="allUsers"
                      checked={formData.forAllUsers}
                      onChange={(e) =>
                        setFormData({ ...formData, forAllUsers: true })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="allUsers" className="cursor-pointer flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Semua Anggota
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="selectedUsers"
                      checked={!formData.forAllUsers}
                      onChange={(e) =>
                        setFormData({ ...formData, forAllUsers: false })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="selectedUsers" className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Beberapa Anggota
                    </Label>
                  </div>
                </div>

                {/* Pilihan Anggota Spesifik dengan Search */}
                {!formData.forAllUsers && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <Label>Pilih Anggota:</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (formData.selectedUsers.length === filteredUsers.length) {
                              setFormData({
                                ...formData,
                                selectedUsers: []
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedUsers: filteredUsers.map(user => user.id)
                              });
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          {formData.selectedUsers.length === filteredUsers.length ? "Batal Pilih Semua" : "Pilih Semua"}
                        </Button>
                      </div>
                      
                      {/* Search Bar untuk Anggota */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Cari nama atau email..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="pl-9 pr-9"
                        />
                        {userSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setUserSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Daftar Anggota */}
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tidak ada anggota yang cocok dengan pencarian
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 py-2 px-1 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={formData.selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    selectedUsers: [...formData.selectedUsers, user.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedUsers: formData.selectedUsers.filter(id => id !== user.id)
                                  });
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`user-${user.id}`} 
                              className="cursor-pointer flex-1"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground sm:ml-2">{user.email}</p>
                              </div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>

                    {formData.selectedUsers.length === 0 && (
                      <p className="text-sm text-orange-600 text-center py-2">
                        Pilih minimal satu anggota
                      </p>
                    )}
                  </div>
                )}
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!formData.forAllUsers && formData.selectedUsers.length === 0}
                >
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ 
                      amount: "", 
                      description: "", 
                      dueDate: "", 
                      autoCreate: false, 
                      weeksCount: "4",
                      selectedUsers: [],
                      forAllUsers: true 
                    });
                    setUserSearchQuery("");
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>            
          </CardContent>
        </Card>
      )}

      {/* Status Cards untuk ANGGOTA */}
      {role === "ANGGOTA" && !allBillsPaid && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="border-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                Tagihan Pending
              </CardTitle>
              <CardDescription>{pendingBills.length} tagihan</CardDescription>
            </CardHeader>            
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {formatCurrency(pendingBills.reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Menunggu Verifikasi
              </CardTitle>
              <CardDescription>{claimedBills.length} tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {formatCurrency(claimedBills.reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Tagihan Lunas
              </CardTitle>
              <CardDescription>{paidBills.length} tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {formatCurrency(paidBills.reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabel untuk BENDAHARA */}
      {role === "BENDAHARA" && !allBillsPaid && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Verifikasi Pembayaran</CardTitle>            
                <CardDescription>
                  Verifikasi pembayaran yang sudah diklaim anggota
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari nama anggota..."
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
                
                {/* Toggle Verified Groups */}
                {verifiedGroupedBills.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowVerified(!showVerified)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showVerified ? "Sembunyikan" : "Tampilkan"} Lunas
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat...</div>
            ) : sortedActiveGroups.length === 0 && !showVerified ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada tagihan yang perlu diverifikasi
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Groups */}
                {sortedActiveGroups.map((group) => (
                  <div key={group.batchId} className="border rounded-lg">
                    <button
                      onClick={() => toggleGroup(group.batchId)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg">{group.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Jatuh tempo: {formatDate(new Date(group.dueDate))}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {group.pendingCount} Pending
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.claimedCount} Menunggu
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {group.paidCount} Lunas
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-base sm:text-lg">
                          {formatCurrency(group.totalAmount)}
                        </p>
                        {expandedGroups.has(group.batchId) ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    
                    {expandedGroups.has(group.batchId) && (
                      <div className="border-t p-4">
                        <div className="space-y-2">
                          {group.bills
                            .sort((a, b) => a.user.name.localeCompare(b.user.name))
                            .map((bill) => (
                            <div
                              key={bill.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg ${
                                bill.status === "CLAIMED_PAID" ? "bg-blue-50 border-blue-200" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2 sm:mb-0">
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
                                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                        Menunggu Verifikasi
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {bill.user.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm sm:text-base">
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
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUnverify(bill.id)}
                                      className="text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                    >
                                      <Undo2 className="h-3 w-3 mr-1" />
                                      Batalkan
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Verified Groups */}
                {showVerified && sortedVerifiedGroups.map((group) => (
                  <div key={group.batchId} className="border rounded-lg border-green-200 bg-green-50">
                    <button
                      onClick={() => toggleGroup(group.batchId)}
                      className="w-full p-4 text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-green-800">{group.description}</h3>
                        <p className="text-sm text-green-600">
                          Jatuh tempo: {formatDate(new Date(group.dueDate))}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Semua {group.bills.length} tagihan sudah lunas
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-base sm:text-lg text-green-800">
                          {formatCurrency(group.totalAmount)}
                        </p>
                        {expandedGroups.has(group.batchId) ? (
                          <ChevronUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </button>
                    
                    {expandedGroups.has(group.batchId) && (
                      <div className="border-t border-green-200 p-4">
                        <div className="space-y-2">
                          {group.bills
                            .sort((a, b) => a.user.name.localeCompare(b.user.name))
                            .map((bill) => (
                            <div
                              key={bill.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-green-200 rounded-lg bg-white"
                            >
                              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <div className="rounded-full p-2 bg-green-100">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{bill.user.name}</p>
                                  <p className="text-sm text-muted-foreground">{bill.user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm sm:text-base text-green-600">
                                  {formatCurrency(bill.amount)}
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                                    ✅ Lunas
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnverify(bill.id)}
                                    className="text-xs"
                                  >
                                    <Undo2 className="h-3 w-3 mr-1" />
                                    Batalkan
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabel untuk ANGGOTA */}
      {role === "ANGGOTA" && !allBillsPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Tagihan Saya</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat...</div>
            ) : sortedIndividualBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada tagihan
              </div>
            ) : (
              <div className="space-y-4">
                {sortedIndividualBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg ${
                      bill.status === "PENDING" ? "border-orange-500" :
                      bill.status === "CLAIMED_PAID" ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
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
                        <Button onClick={() => handleClaimPaid(bill.id)} size="sm" className="whitespace-nowrap">
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

      {/* Pesan Semua Tagihan Lunas */}
      {allBillsPaid && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800">Semua Tagihan Sudah Lunas!</h3>
              <p className="text-green-600 mt-2">Tidak ada tagihan yang perlu dikelola saat ini.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}