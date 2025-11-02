import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "BENDAHARA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });

    // Group transactions by type
    const masuk = transactions.filter((t) => t.type === "MASUK");
    const keluar = transactions.filter((t) => t.type === "KELUAR");
    
    // Group masuk by description
    const groupedMasuk = masuk.reduce((acc, t) => {
      const prefix = t.description.split(" - ")[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(t);
      return acc;
    }, {} as Record<string, typeof masuk>);

    // Prepare worksheets data
    const worksheets: { name: string; data: any[][] }[] = [];

    // Sheet 1: Rekap Kas (grouped)
    const kasRows = [
      ["REKAP KAS"],
      [""],
      ["Tanggal", "Keterangan", "Jumlah"],
    ];
    
    Object.entries(groupedMasuk).forEach(([desc, trans]) => {
      trans.forEach((t) => {
        // Gabungkan nama anggota dengan keterangan
        const keterangan = `${t.description} - ${t.user.name}`;
        
        kasRows.push([
          new Date(t.createdAt).toLocaleDateString("id-ID"),
          keterangan,
          t.amount.toString(), // Convert to string
        ]);
      });
    });

    // Calculate total and convert to string
    const totalKas = Object.values(groupedMasuk).flat().reduce((sum, t) => sum + t.amount, 0);
    kasRows.push([
      "", 
      "TOTAL KAS:", 
      totalKas.toString() // Convert to string
    ]);
    
    // Create workbook and add worksheets
    const wb = XLSX.utils.book_new();
    
    // Add Rekap Kas sheet
    const ws = XLSX.utils.aoa_to_sheet(kasRows);
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Kas");

    // Sheet 2: Pengeluaran
    const pengeluaranRows = [
      ["PENGELUARAN"],
      [""],
      ["Tanggal", "Keterangan", "Jumlah"],
    ];
    
    keluar.forEach((t) => {
      // Untuk pengeluaran, tambahkan nama user jika ada
      const keterangan = t.user ? `${t.description} - ${t.user.name}` : t.description;
      
      pengeluaranRows.push([
        new Date(t.createdAt).toLocaleDateString("id-ID"),
        keterangan,
        t.amount.toString(), // Convert to string
      ]);
    });

    // Calculate total pengeluaran and convert to string
    const totalPengeluaran = keluar.reduce((sum, t) => sum + t.amount, 0);
    pengeluaranRows.push(["", "TOTAL:", totalPengeluaran.toString()]); // Convert to string
    
    const wsPengeluaran = XLSX.utils.aoa_to_sheet(pengeluaranRows);
    XLSX.utils.book_append_sheet(wb, wsPengeluaran, "Pengeluaran");

    // Sheet 3: Summary - tetap sebagai number untuk perhitungan Excel
    const totalMasuk = masuk.reduce((sum, t) => sum + t.amount, 0);
    const totalKeluar = keluar.reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalMasuk - totalKeluar;
    
    const summaryRows = [
      ["RINGKASAN KEUANGAN"],
      [""],
      ["Total Pemasukan", totalMasuk], // Tetap number agar Excel bisa kalkulasi
      ["Total Pengeluaran", totalKeluar], // Tetap number agar Excel bisa kalkulasi
      ["Saldo Akhir", saldo], // Tetap number agar Excel bisa kalkulasi
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Return file with correct headers
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap-kas-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}