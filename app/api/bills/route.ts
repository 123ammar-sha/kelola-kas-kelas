import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.bill.findMany({
      where:
        session.user.role === "ANGGOTA"
          ? { userId: session.user.id }
          : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "BENDAHARA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, description, dueDate, weeksCount } = body;

    if (!amount || !description || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get all members (ANGGOTA role)
    const members = await prisma.user.findMany({
      where: { role: "ANGGOTA" },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No members found" },
        { status: 404 }
      );
    }

    // Determine how many times to create bills
    const count = weeksCount ? parseInt(weeksCount) : 1;
    const allBills = [];

    // Create bills for each week
    for (let week = 0; week < count; week++) {
      const batchId = `batch_${Date.now()}_${week}`;
      const currentDueDate = new Date(dueDate);
      currentDueDate.setDate(currentDueDate.getDate() + (week * 7));
      
      const weekDescription = count > 1 
        ? `${description} - Minggu ${week + 1}`
        : description;

      const billData = members.map((member) => ({
        amount: parseFloat(amount),
        description: weekDescription,
        dueDate: currentDueDate,
        userId: member.id,
        batchId,
      }));

      await prisma.bill.createMany({ data: billData });

      // Fetch created bills with user info
      const createdBills = await prisma.bill.findMany({
        where: { batchId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      allBills.push(...createdBills);
    }

    return NextResponse.json(allBills);
  } catch (error) {
    console.error("Error creating bills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
