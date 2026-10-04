import type { Metadata } from "next";
import Content from "./Content";

const title = "Camp POS: Cashless Canteen Store Software";
const description =
  "Run the camp store without cash. Staff find the camper by name, charge their canteen wallet, and every sale is logged. Works on any phone, tablet or laptop.";
const url = "https://camperroster.com/cashless-camp-canteen-pos";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "CamperRoster" }
};

export default function Page() {
  return <Content />;
}
