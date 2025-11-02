import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, BillStatus } from "@prisma/client";

export async function GET() {
  try {
    const now = new Date();

    // Get total number of ANGGOTA users
    const totalAnggota = await prisma.user.count({
      where: { role: Role.ANGGOTA }
    });

    const bills = await prisma.bill.findMany({
      where: { 
        dueDate: { gte: now },
        user: { role: Role.ANGGOTA },
        // Only show unpaid bills
        status: {
          in: [BillStatus.PENDING, BillStatus.CLAIMED_PAID]
        }
      },
      orderBy: { dueDate: "asc" },
      take: totalAnggota,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const data = bills.map((b) => ({
      id: b.id,
      dueDate: b.dueDate.toISOString(),
      amount: b.amount,
      description: b.description,
      status: b.status,
      user: {
        name: b.user?.name ?? null,
        email: b.user?.email ?? null,
      },
    }));

    return NextResponse.json({
      total: totalAnggota,
      data: data
    });
  } catch (error) {
    console.error("ERROR /api/public/upcoming-bills:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}