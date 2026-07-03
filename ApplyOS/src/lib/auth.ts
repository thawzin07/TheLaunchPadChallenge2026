import { ensureDatabase, prisma } from "@/lib/db";
import { parseProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase-ssr";

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.id || !authUser.email) return null;

  await ensureDatabase();
  const name =
    typeof authUser.user_metadata?.name === "string" && authUser.user_metadata.name.trim()
      ? authUser.user_metadata.name.trim()
      : authUser.email.split("@")[0];

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email: authUser.email,
      name,
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      name,
      profile: { create: {} },
    },
    include: { profile: true },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profile: parseProfile(user.profile),
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}
