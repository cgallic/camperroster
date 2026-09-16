import type { Metadata } from "next";
import Content from "./Content";

const title = "UltraCamp Alternative: $0 Off-Season | CamperRoster";
const description =
  "Leave UltraCamp's $275-$975/month winter retainer behind. CamperRoster is $0 off-season and $4-$6 per registered camper, with 1-click CSV roster migration.";
const url = "https://camperroster.com/ultracamp-alternative";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
