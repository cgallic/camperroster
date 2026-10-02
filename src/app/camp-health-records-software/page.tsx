import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp Health Records Software (EHR + eMAR) | CamperRoster";
const description =
  "Collect camper health forms, immunizations and waivers in registration with one parent login. Built-in eMAR that logs doses by meal window.";
const url = "https://camperroster.com/camp-health-records-software";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
