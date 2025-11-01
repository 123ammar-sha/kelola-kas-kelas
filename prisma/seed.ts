import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const bendaharaPassword = await bcrypt.hash("bendahara123", 10);
  const memberPassword = await bcrypt.hash("anggota123", 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@kelas.local" },
    update: {},
    create: {
      email: "admin@kelas.local",
      name: "Administrator",
      password: adminPassword,
      role: "ADMINISTRATOR",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create Bendahara
  const bendahara = await prisma.user.upsert({
    where: { email: "bendahara@kelas.local" },
    update: {},
    create: {
      email: "bendahara@kelas.local",
      name: "Bendahara Kelas",
      password: bendaharaPassword,
      role: "BENDAHARA",
    },
  });
  console.log("✅ Bendahara created:", bendahara.email);

  // Create Sample Members
  const members = [
    { name: "Anggota 1", email: "anggota1@kelas.local" },
    { name: "Anggota 2", email: "anggota2@kelas.local" },
    { name: "Anggota 3", email: "anggota3@kelas.local" },
  ];

  for (const member of members) {
    const created = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        ...member,
        password: memberPassword,
        role: "ANGGOTA",
      },
    });
    console.log("✅ Member created:", created.email);
  }

  // Create Sample Transactions
  const transactions = [
    {
      type: "MASUK" as const,
      amount: 150000,
      description: "Kas bulan Januari",
      userId: bendahara.id,
    },
    {
      type: "MASUK" as const,
      amount: 50000,
      description: "Sumbangan anggota tambahan",
      userId: bendahara.id,
    },
    {
      type: "KELUAR" as const,
      amount: 75000,
      description: "Bayar listrik kelas",
      userId: bendahara.id,
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: transaction,
    });
  }
  console.log("✅ Sample transactions created");

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Default credentials:");
  console.log("   Admin: admin@kelas.local / admin123");
  console.log("   Bendahara: bendahara@kelas.local / bendahara123");
  console.log("   Anggota: anggota1@kelas.local / anggota123");
  console.log("\n⚠️  Please change default passwords after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
