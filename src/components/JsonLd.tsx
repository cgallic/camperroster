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

      "Express QR Gate Check-In",
      "Daily Bunk Notes Parent Mail Call Batch Printing",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does CamperRoster's $0 off-season pricing model work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike legacy software systems like UltraCamp that lock camps into $275 to $975 monthly retainers year-round, CamperRoster charges $0/month during your 7 to 9 off-season months. You only pay transparent fees during active registration periods."
        }
      },
      {
        "@type": "Question",
        "name": "How does the KaiCalls automated volunteer reference check work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Applicants give a pastor or professional mentor as a reference when they apply, and that reference is filed against the application in your director dashboard for review. Automated KaiCalls voice interviews, which dial the reference and transcribe the call, are in development and are not placing calls yet."
        }
      },
      {
        "@type": "Question",
        "name": "Is CamperRoster HIPAA and ACA safety compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All medical disclosures, EpiPen care plans, and health insurance card uploads are encrypted with Row-Level Security (RLS) in PostgreSQL, isolating confidential medical records exclusively to licensed Health Lodge staff in compliance with ACA and HIPAA standards."
        }
      },
      {
        "@type": "Question",
        "name": "Can parents register multiple children and select installment plans?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Parents can register their entire household in one session, choose between deposit or pay-in-full options, and upload medical records with zero password friction."
        }
      }
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
