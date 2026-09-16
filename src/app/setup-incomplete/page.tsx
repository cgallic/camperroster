export const metadata = { title: "Setup incomplete" };

/**
 * Shown when the database has not been migrated. Deliberately distinct from
 * /no-access: an unmigrated deployment looks identical to "you have no
 * permission" from the outside, and the two need completely different fixes.
 */
export default function SetupIncompletePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">This camp isn&apos;t set up yet</h1>
      <p className="mt-3 text-sm text-stone-600">
        The database is missing tables the app needs. This is a deployment step, not something wrong with
        your account — whoever set up this site needs to apply the migrations in{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">supabase/migrations</code>.
      </p>
    </main>
  );
}
