import type { Metadata } from "next";
import Content from "./Content";

const title = "CampMinder Alternative for Small Camps | CamperRoster";
const description =
  "A lighter CampMinder alternative for church, nonprofit, day and overnight camps. Published pricing: $4-$6 per camper, $0/month off-season, $0 setup.";
const url = "https://camperroster.com/campminder-alternative";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
