import type { Metadata } from "next";
import Content from "./Content";

const title = "Church Camp Software: Registration & Group Billing";
const description =
  "Register a whole youth group from one link with health forms, buddy requests, typed e-signatures, and card payment plans.";
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
