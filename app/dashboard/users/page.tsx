import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersPageClient } from "@/components/users/users-page-client";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMINISTRATOR") {
    redirect("/dashboard");
  }

  return <UsersPageClient />;
}
