import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { TransactionPageClient } from "@/components/transaksi/transaction-page-client";

export default async function TransaksiPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BENDAHARA") {
    redirect("/dashboard");
  }

  return <TransactionPageClient />;
}
