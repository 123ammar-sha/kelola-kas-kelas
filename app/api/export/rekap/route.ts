import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import XLSX from "xlsx";

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

    // Group transactions by type and description
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

    // Prepare worksheets
    const worksheets: { name: string; data: any[][] }[] = [];

    // Sheet 1: Rekap Kas (grouped)
    const kasRows: any[][] = [
      ["REKAP KAS"],
      [""],
      ["Tanggal", "Keterangan", "Anggota", "Jumlah"],
    ];
    
    Object.entries(groupedMasuk).forEach(([desc, trans]) => {
      trans.forEach((t) => {
        kasRows.push([
          new Date(t.createdAt).toLocaleDateString("id-ID"),
          t.description.split(" - ")[0],
          t.description.split(" - ")[1] || "-",
          t.amount,
        ]);
      });
    });

    kasRows.push(["", "", "TOTAL KAS:", Object.values(groupedMasuk).flat().reduce((sum, t) => sum + t.amount, 0)]);
    worksheets.push({ name: "Rekap Kas", data: kasRows });

    // Sheet 2: Pemasukan Lainnya
    const kasDescriptions = Object.keys(groupedMasuk);
    const pemasukanLain = masuk.filter(
      (t) => !kasDescriptions.includes(t.description.split(" - ")[0])
    );
    const pemasukanRows: any[][] = [
      ["PEMASUKAN LAINNYA"],
      [""],
      ["Tanggal", "Keterangan", "Jumlah"],
    ];
    
    pemasukanLain.forEach((t) => {
      pemasukanRows.push([
        new Date(t.createdAt).toLocaleDateString("id-ID"),
        t.description,
        t.amount,
      ]);
    });

    pemasukanRows.push(["", "TOTAL:", pemasukanLain.reduce((sum, t) => sum + t.amount, 0)]);
    worksheets.push({ name: "Pemasukan Lain", data: pemasukanRows });

    // Sheet 3: Pengeluaran
    const pengeluaranRows: any[][] = [
      ["PENGELUARAN"],
      [""],
      ["Tanggal", "Keterangan", "Jumlah"],
    ];
    
    keluar.forEach((t) => {
      pengeluaranRows.push([
        new Date(t.createdAt).toLocaleDateString("id-ID"),
        t.description,
        t.amount,
      ]);
    });

    pengeluaranRows.push(["", "TOTAL:", keluar.reduce((sum, t) => sum + t.amount, 0)]);
    worksheets.push({ name: "Pengeluaran", data: pengeluaranRows });

    // Sheet 4: Summary
    const totalMasuk = masuk.reduce((sum, t) => sum + t.amount, 0);
    const totalKeluar = keluar.reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalMasuk - totalKeluar;
    
    const summaryRows: any[][] = [
      ["RINGKASAN KEUANGAN"],
      [""],
      ["Total Pemasukan", totalMasuk],
      ["Total Pengeluaran", totalKeluar],
      ["Saldo Akhir", saldo],
    ];
    worksheets.push({ name: "Ringkasan", data: summaryRows });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    worksheets.forEach((sheet) => {
      const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap-kas-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

