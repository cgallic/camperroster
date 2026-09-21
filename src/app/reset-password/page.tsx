import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      <div>
        <h1 className="font-display font-black text-3xl text-stone-900">Choose a new password</h1>
        <p className="text-sm text-stone-600 mt-2">Use at least 10 characters. This page only works from the reset link sent to your email.</p>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
