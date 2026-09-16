import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ParentPortalClient from "./ParentPortalClient";

export default async function ParentPortalRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parents have no camp_members row, so signed-in is the only requirement.
  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  return <ParentPortalClient />;
}
