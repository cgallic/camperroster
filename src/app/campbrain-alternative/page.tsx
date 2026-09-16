import type { Metadata } from "next";
import Content from "./Content";

const title = "CampBrain Alternative: No Setup Fee | CamperRoster";
const description =
  "A CampBrain alternative with no $2,000-$5,000 implementation fee and no annual retainer. Pay $4-$6 per registered camper, import your CSV, launch in 3 minutes.";
const url = "https://camperroster.com/campbrain-alternative";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
