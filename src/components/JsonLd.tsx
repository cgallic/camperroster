export default function JsonLd() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CamperRoster",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "url": "https://camperroster.com",
    "description": "Modern camp registration software and operations platform with zero off-season retainers, automated KaiCalls AI voice reference checking, health lodge eMAR, and cashless canteen POS.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "description": "$0/month off-season retainer guarantee"
    },
    "featureList": [
      "5-Step Camper Registration Wizard",
      "KaiCalls Automated 2-Minute AI Phone Reference Checking",
      "Health Lodge Electronic Medication Administration Records (eMAR)",
      "Cashless Canteen Point of Sale (POS)",
      "1-Tap SMS Magic Links (Passwordless Parent Login)",
      "45-Second Express QR Gate Check-In",
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
          "text": "When a staff applicant or volunteer applies, KaiCalls AI Voice Assistant calls their pastor or professional mentor directly. It conducts a structured 2-minute safety interview, records the audio, and saves the verified transcript and safety score directly into your director dashboard."
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
          "text": "Yes. Parents can register their entire household in one session, choose between $100 deposit plans, 3-month automated installment schedules, or pay-in-full, and upload medical records with zero password friction."
        }
      }
    ]
  };

  const campSessionsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Camp Hope Summer 2027 Sessions",
    "itemListElement": [
      {
        "@type": "Event",
        "position": 1,
        "name": "Camp Hope - Junior Camp (Grades 2-4)",
        "startDate": "2027-07-11",
        "endDate": "2027-07-17",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
          "@type": "Place",
          "name": "Camp Hope Lakefront Facility",
          "address": "Lancaster, PA"
        },
        "offers": {
          "@type": "Offer",
          "price": "650.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://camperroster.com/register"
        }
      },
      {
        "@type": "Event",
        "position": 2,
        "name": "Camp Hope - Intermediate Camp (Grades 5-6)",
        "startDate": "2027-07-18",
        "endDate": "2027-07-24",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
          "@type": "Place",
          "name": "Camp Hope Lakefront Facility",
          "address": "Lancaster, PA"
        },
        "offers": {
          "@type": "Offer",
          "price": "650.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://camperroster.com/register"
        }
      },
      {
        "@type": "Event",
        "position": 3,
        "name": "Camp Hope - Senior Teen Camp (Grades 7-8)",
        "startDate": "2027-07-25",
        "endDate": "2027-07-31",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
          "@type": "Place",
          "name": "Camp Hope Lakefront Facility",
          "address": "Lancaster, PA"
        },
        "offers": {
          "@type": "Offer",
          "price": "675.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://camperroster.com/register"
        }
      }
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(campSessionsSchema) }}
      />
    </>
  );
}
