import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp Registration Software vs Google Forms";
const description =
  "Google Forms and Venmo cost directors 100+ hours of manual payment matching and leave medical data unprotected. Compare with purpose-built camp software.";
const url = "https://camperroster.com/camp-registration-software-vs-google-forms";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
