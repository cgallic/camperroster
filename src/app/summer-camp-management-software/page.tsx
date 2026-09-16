import type { Metadata } from "next";
import Content from "./Content";

const title = "Summer Camp Management Software: One Platform";
const description =
  "One platform for summer camp registration, Health Lodge eMAR, parent mail, and canteen POS. $0 in your off-season months and $4-$6 per registered camper.";
const url = "https://camperroster.com/summer-camp-management-software";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
