import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camp Registration Software vs Google Forms",
  description: "Google Forms and Venmo mean manual payment reconciliation and medical records in a spreadsheet. See what camps gain by moving registration, health forms, and payments into one system.",
  alternates: { canonical: "/camp-registration-software-vs-google-forms" },
  openGraph: {
    title: "Camp Registration Software vs Google Forms",
    description: "Google Forms and Venmo mean manual payment reconciliation and medical records in a spreadsheet. See what camps gain by moving registration, health forms, and payments into one system.",
    url: "/camp-registration-software-vs-google-forms",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
