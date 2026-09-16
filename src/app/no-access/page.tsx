import Link from "next/link";

export const metadata = { title: "No access" };

export default function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to this area</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your account is signed in but your role doesn&apos;t include this page. Ask the camp director if you
        think this is wrong.
      </p>
      <Link href="/" className="mt-6 text-emerald-800 underline">
        Back to home
      </Link>
    </main>
  );
}
