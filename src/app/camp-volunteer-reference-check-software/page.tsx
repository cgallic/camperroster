import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp Volunteer Reference Check Software | CamperRoster";
const description =
  "Collect a reference with every volunteer application and keep the camp director's review attached to the applicant in one place.";
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
