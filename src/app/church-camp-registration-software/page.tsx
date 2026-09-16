import type { Metadata } from "next";
import Content from "./Content";

const title = "Church Camp Registration Software & Group Billing";
const description =
  "Register a whole youth group from one link: 1-tap SMS sign-in, split church-and-parent billing, sponsor codes, buddy requests, and ACH deposit plans.";
const url = "https://camperroster.com/church-camp-registration-software";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
