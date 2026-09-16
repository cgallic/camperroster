import type { Metadata } from "next";
import Content from "./Content";

const title = "Cashless Camp Canteen POS | Digital Wristbands";
const description =
  "Run the camp store cashless. Campers scan a digital wristband at the snack shack, parents reload the wallet online, and leftover balances refund at checkout.";
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
