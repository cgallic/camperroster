import type { Metadata } from "next";
import Content from "./Content";

const title = "CampDoc Alternative: Built-In eMAR | CamperRoster";
const description =
  "Drop CampDoc's $6-$12 per-camper fee and second parent login. CamperRoster ships native HIPAA and ACA Health Lodge eMAR, offline med logging, no parent ads.";
const url = "https://camperroster.com/campdoc-alternative";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
