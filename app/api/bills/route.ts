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
    const { amount, description, dueDate, weeksCount, userIds, forAllUsers } = body;

    if (!amount || !description || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Dapatkan users berdasarkan pilihan
    let targetUsers;
    if (forAllUsers) {
      // Untuk semua anggota
      targetUsers = await prisma.user.findMany({
        where: { role: "ANGGOTA" },
      });
    } else {
      // Untuk user tertentu
      if (!userIds || userIds.length === 0) {
        return NextResponse.json(
          { error: "User IDs are required when not for all users" },
          { status: 400 }
        );
      }
      targetUsers = await prisma.user.findMany({
        where: { 
          id: { in: userIds },
          role: "ANGGOTA" 
        },
      });
    }

    if (targetUsers.length === 0) {
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

      const billData = targetUsers.map((user) => ({
        amount: parseFloat(amount),
        description: weekDescription,
        dueDate: currentDueDate,
        userId: user.id,
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