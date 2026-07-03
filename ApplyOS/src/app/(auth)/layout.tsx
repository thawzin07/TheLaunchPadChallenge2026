import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen bg-stone-50 px-4 py-8 text-stone-950">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden max-w-xl gap-5 lg:grid">
          <div className="text-sm font-semibold tracking-wide text-stone-500">ApplyOS</div>
          <h2 className="text-4xl font-semibold tracking-tight">A serious workspace for serious applications.</h2>
          <p className="text-base leading-7 text-stone-600">
            Build one private profile, discover Singapore roles, generate evidence-backed application materials, track every
            application, and prepare for the interview from the same source of truth.
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-stone-200 bg-white p-4">No auto-submit</div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">Evidence-first AI</div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">Mock mode ready</div>
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}
