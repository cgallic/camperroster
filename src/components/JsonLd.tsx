export default function JsonLd() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CamperRoster",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "url": "https://camperroster.com",
    "description": "Modern camp registration software and operations platform with zero off-season retainers, health lodge eMAR, and cashless canteen POS.",
    "offers": {
      "@type": "Offer",
      "price": "4.00",
      "priceCurrency": "USD",
      "unitText": "per registered camper",
      "description": "Per-camper pricing from $4.00; $0/month during the off-season"
    },
    "featureList": [
      "5-Step Camper Registration Wizard",

      "Health Lodge Electronic Medication Administration Records (eMAR)",
      "Cashless Canteen Point of Sale (POS)",

      "Opening-Day Gate Check-In",
      "Daily Bunk Notes Batch Printing",
      "Counselor Mobile Cabin Roster"
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CamperRoster Inc.",
    "url": "https://camperroster.com",
    "logo": "https://camperroster.com/images/camp_hero.jpg",
    "sameAs": [
      "https://github.com/cgallic/camperroster"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "director@camperroster.com",
      "url": "https://camperroster.com"
    }
  };

  // FAQPage schema is emitted per page by <FaqJsonLd> from the FAQs that page
  // actually shows. A sitewide copy here put the homepage FAQs on every route.

  // NOTE: a campSessionsSchema ItemList used to publish "Camp Hope" July 2027 sessions
  // here as bookable schema.org/Event records with InStock availability. Camp Hope is our
  // demo camp, so those events do not exist and were removed rather than shipped to search
  // engines as real, purchasable dates.

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
