import type { Metadata } from "next";
import Content from "./Content";

const title = "Christian Camp Software for Ministry Camps";
const description =
  "Software for Christian camps, retreats, and conference centers: KaiCalls pastoral reference calls, Health Lodge eMAR, Bunk Notes mail, $0 off-season fees.";
const url = "https://camperroster.com/christian-camp-software";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
