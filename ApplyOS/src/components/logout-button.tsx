"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setNextToast } from "@/components/toast";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setNextToast("Signed out.", "success");
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={logout} disabled={pending} title="Sign out">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
