"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BillPublic {
  id: string;
  dueDate: string | null;
  amount: number;
  description: string;
  status: "PENDING" | "CLAIMED_PAID" | "PAID" | "OVERDUE";
  user: {
    name: string | null;
    email: string | null;
  };
}

export default function TagihanTerdekatPage() {
  const [bills, setBills] = useState<BillPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/public/upcoming-bills");
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Status ${res.status}`);
        }

        // terima respons apa pun: array atau { total, data }
        const raw = await res.json();
        let list: BillPublic[] = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (Array.isArray(raw.data)) {
          list = raw.data;
        } else if (Array.isArray(raw.result)) { // fallback jika struktur lain
          list = raw.result;
        } else {
          // jika struktur tidak dikenal, coba ambil semua nilai yang mungkin
          list = Array.isArray(raw?.data?.data) ? raw.data.data : [];
        }

        if (mounted) setBills(list);
      } catch (err) {
        console.error("Gagal ambil tagihan terdekat:", err);
        if (mounted) setBills([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Memastikan pencarian tidak case sensitive dan menangani nilai null
   const filteredBills = Array.isArray(bills)
    ? bills.filter((bill) => {
        const userName = bill.user?.name?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return userName.includes(query);
      })
    : [];


  const handleSelengkapnya = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    router.push("/dashboard/tagihan");
  };

  return (    
    <div className="min-h-screen flex items-start justify-center p-6 bg-background">
      <div className="w-full max-w-xl bg-card rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-semibold mb-4">Tagihan Terdekat</h1>
        {/* Search Bar */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Cari nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada tagihan mendatang</p>
        ) : filteredBills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada hasil pencarian untuk "{searchQuery}"</p>
        ) : (
          <ul className="space-y-2">
            {filteredBills.map((b) => (
              <li key={b.id} className="flex flex-col border rounded p-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-medium text-sm">{b.user?.name ?? "-"}</span>
                    <span className="text-xs text-muted-foreground block">{b.user?.email ?? "-"}</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {formatCurrency(b.amount)}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t text-sm">
                  <p className="text-muted-foreground">{b.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Jatuh tempo: {new Date(b.dueDate!).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Total: {bills.length} tagihan
          </p>
          <Button onClick={handleSelengkapnya} size="sm">
            Selengkapnya
          </Button>
        </div>
      </div>
    </div>
  );
}  


