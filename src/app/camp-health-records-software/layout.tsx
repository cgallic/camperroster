import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camp Health Records Software (EHR + eMAR)",
  description: "Collect camper health forms, immunization records, and waivers inside registration, with a built-in Health Lodge eMAR for medication logging.",
  alternates: { canonical: "/camp-health-records-software" },
  openGraph: {
    title: "Camp Health Records Software (EHR + eMAR)",
    description: "Collect camper health forms, immunization records, and waivers inside registration, with a built-in Health Lodge eMAR for medication logging.",
    url: "/camp-health-records-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
