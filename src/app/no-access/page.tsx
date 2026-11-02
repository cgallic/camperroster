import Link from "next/link";

export const metadata = { title: "No access" };

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const noCamp = reason === "no_camp";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        {noCamp ? "Your account isn't on a camp team yet" : "You don't have access to this area"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {noCamp
          ? "You're signed in, but this email hasn't joined a camp. Open the invitation link your camp director sent you, or ask them to send a new one to this email address."
          : "Your account is signed in but your role doesn't include this page. Ask the camp director if you think this is wrong."}
      </p>
      <Link href="/" className="mt-6 text-emerald-800 underline">
        Back to home
      </Link>
    </main>
  );
}
