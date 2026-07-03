import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-frame";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppFrame user={{ name: user.name, email: user.email }}>{children}</AppFrame>;
}
