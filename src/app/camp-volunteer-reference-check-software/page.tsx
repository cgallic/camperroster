import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp Volunteer Reference Check Software | Voice AI";
const description =
  "Automate camp volunteer reference checks. KaiCalls Voice AI phones each reference, runs a 2-minute child-safety interview, and returns audio and transcripts.";
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
