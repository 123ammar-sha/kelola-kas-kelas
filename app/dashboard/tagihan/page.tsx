import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TagihanPageClient } from "@/components/tagihan/tagihan-page-client";

export default async function TagihanPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <TagihanPageClient role={session.user.role} />;
}
