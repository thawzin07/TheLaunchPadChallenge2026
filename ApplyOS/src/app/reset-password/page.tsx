import { ResetPasswordForm } from "@/components/reset-password-form";
import { getCurrentUser } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4 py-8 text-stone-950">
      <ResetPasswordForm canReset={Boolean(user)} email={user?.email} />
    </main>
  );
}

