import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnggotaPageClient } from "@/components/anggota/anggota-page-client";

export default async function AnggotaPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BENDAHARA") {
    redirect("/dashboard");
  }

  return <AnggotaPageClient />;
}
