import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camp Volunteer Reference Check Software",
  description: "Collect a reference with every volunteer application and keep the director's review and approval attached to the applicant, instead of notes scattered across email.",
  alternates: { canonical: "/camp-volunteer-reference-check-software" },
  openGraph: {
    title: "Camp Volunteer Reference Check Software",
    description: "Collect a reference with every volunteer application and keep the director's review and approval attached to the applicant, instead of notes scattered across email.",
    url: "/camp-volunteer-reference-check-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
