import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp Volunteer Reference Check Software | Voice AI";
const description =
  "Collect volunteer reference details, keep reviews attached to each application, and track the camp director's follow-up in one place.";
const url = "https://camperroster.com/camp-volunteer-reference-check-software";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
