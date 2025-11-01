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

    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Update bill to PAID
    const updatedBill = await prisma.bill.update({
      where: { id: params.id },
      data: { status: "PAID" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create transaction as MASUK (pemasukan)
    const transaction = await prisma.transaction.create({
      data: {
        amount: bill.amount,
        type: "MASUK",
        description: `${bill.description} - ${bill.user.name}`,
        userId: session.user.id, // Created by bendahara
      },
    });

    return NextResponse.json({
      bill: updatedBill,
      transaction,
    });
  } catch (error) {
    console.error("Error paying bill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
