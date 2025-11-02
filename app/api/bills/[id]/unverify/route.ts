import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "BENDAHARA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billId = params.id;

    // Cek apakah bill exists dan include transaction info
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Hanya bisa unverify bill yang statusnya PAID
    if (bill.status !== "PAID") {
      return NextResponse.json(
        { error: "Hanya tagihan yang sudah terverifikasi yang bisa dibatalkan" },
        { status: 400 }
      );
    }

    // Cari transaksi yang terkait dengan tagihan ini
    const transactionDescription = `${bill.description} - ${bill.user.name}`;
    
    const relatedTransaction = await prisma.transaction.findFirst({
      where: {
        description: transactionDescription,
        amount: bill.amount,
        type: "MASUK",
      },
    });

    // Hapus transaksi jika ditemukan
    if (relatedTransaction) {
      await prisma.transaction.delete({
        where: { id: relatedTransaction.id },
      });
    }

    // Update status bill kembali ke CLAIMED_PAID
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: { status: "CLAIMED_PAID" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error unverifying bill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}