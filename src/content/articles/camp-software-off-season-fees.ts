import type { Article } from "./types";

const article: Article = {
  slug: "camp-software-off-season-fees",
  title: "Why You Pay for Camp Software in February",
  metaTitle: "Camp Software Off-Season Fees Explained",
  description:
    "Camp runs ten weeks and most camp software bills twelve months. Here is how the four pricing models actually work, and how to calculate what a system costs you per camper before you sign.",
  published: "2026-09-16",
  category: "Buying Guide",
  readMinutes: 7,
  related: [
    { href: "/pricing", label: "CamperRoster pricing" },
    { href: "/ultracamp-alternative", label: "Compared with UltraCamp" },
    { href: "/campbrain-alternative", label: "Compared with CampBrain" }
  ],
  body: [
    {
      type: "p",
      text: "A residential camp operates for eight to ten weeks. Registration work runs longer — call it five months, from when registration opens in January to when the last session closes out in August. For the remaining seven months, the software sits there."
    },
    {
      type: "p",
      text: "Most camp platforms bill for all twelve. That is not necessarily unfair; the vendor's costs do not stop in October either. But it means the sticker price and the real price are different numbers, and the gap is where camp budgets get quietly eaten."
    },
    { type: "h2", text: "The four pricing models" },
    {
      type: "table",
      head: ["Model", "How it bills", "Where it hurts"],
      rows: [
        ["Flat annual license", "One yearly fee regardless of enrolment", "Small camps subsidise large ones. A 90-camper camp pays close to what a 600-camper camp pays."],
        ["Monthly subscription", "Billed every month, in season and out", "Seven months of paying for a system nobody logs into. This is the off-season retainer."],
        ["Per-camper fee", "A charge for each registered camper", "Scales with growth, which feels fair until a good year costs you more than the good year earned."],
        ["Setup or implementation fee", "One-time, at the start", "Usually the largest single number, and the one that makes leaving expensive later."]
      ]
    },
    {
      type: "p",
      text: "Most vendors combine two or three of these. The combination is what makes quotes hard to compare — and it is usually why two systems that both sound like \"about three hundred a month\" differ by thousands over a season."
    },
    { type: "h2", text: "How to work out the real number" },
    {
      type: "p",
      text: "Ignore the headline price. Compute cost per camper per season, which is the only figure that lets you compare two quotes:"
    },
    {
      type: "ol",
      items: [
        "Add **twelve months** of any recurring fee — not five. If the contract bills monthly, you are paying through the winter whether or not the quote presents it that way.",
        "Add the **per-camper fees** at your realistic enrolment, not last year's.",
        "Add **one year's share of the setup fee**, amortised over how long you honestly expect to stay. Three years is a reasonable assumption.",
        "Add **payment processing** if the platform takes a percentage on top of the card rate. On a $600 tuition this is often larger than the software fee itself.",
        "Add anything **parents are charged separately** — a health-records fee, a convenience fee, a separate account. It is still your cost; it is just collected from your families instead of your budget.",
        "Divide the total by your camper count."
      ]
    },
    {
      type: "callout",
      title: "The number that surprises people is usually processing",
      text: "A platform surcharge of 1% on top of standard card processing, on 350 campers at $850 tuition, is about $3,000 a season. That is frequently more than the subscription being negotiated over."
    },
    { type: "h2", text: "Questions worth asking before you sign" },
    {
      type: "ul",
      items: [
        "**Do I pay in the off-season, and can I pause?** Some vendors will quietly agree to a reduced winter rate if asked directly. Almost none advertise it.",
        "**What does it cost to leave?** Specifically: can you export camper records, health history, and registration data in a usable format, and is there a fee for it?",
        "**Are parents charged anything by you?** A per-camper health-records fee billed to families is a real cost of your choice, and families attribute it to your camp, not the vendor.",
        "**What happens in year two?** Introductory pricing that resets after the first season is common.",
        "**Is the setup fee refundable if we do not go live?** Worth asking; occasionally the answer is yes."
      ]
    },
    {
      type: "h2",
      text: "When switching actually makes sense"
    },
    {
      type: "p",
      text: "Not always. Migration lands on the same person who runs hiring, and doing it in March is a bad idea regardless of how good the new system is."
    },
    {
      type: "p",
      text: "The window that works is late August through October. The season is fresh enough that you remember exactly what broke, your data is complete, and you are far enough from January that a parallel run is possible. A camp that decides in February will either rush the migration or spend another full year on the platform it wanted to leave."
    },
    {
      type: "p",
      text: "Three signals that it is worth the disruption: you are paying a meaningful monthly fee through the winter for something nobody opens; parents are being charged a separate fee or made to keep a second login; or the system cannot produce a straight answer to a question like how many doses of a medication were given last season."
    },
    {
      type: "cta",
      title: "$0 per month in the off-season",
      text: "CamperRoster charges when campers register and nothing through the winter. No setup fee, no separate per-camper health charge, and no second account for parents.",
      href: "/pricing",
      label: "See the pricing"
    },
    {
      type: "faq",
      items: [
        {
          q: "Why do camp software vendors charge year-round?",
          a: "Because their own costs — hosting, support, development — are continuous, and because most were built on a standard SaaS subscription model rather than one designed around a seasonal business. It is a pricing convention, not a technical requirement."
        },
        {
          q: "Can I negotiate off-season pricing?",
          a: "Often, if you ask explicitly and time it near renewal. Ask for a reduced or paused winter rate rather than a general discount, since that is the specific mismatch you are correcting."
        },
        {
          q: "When is the best time to switch camp software?",
          a: "Late August through October, right after the season ends. You still remember what failed, your data is complete, and there is room to run both systems in parallel before registration opens."
        },
        {
          q: "What should camp registration software cost per camper?",
          a: "There is no single benchmark, because the models differ so much. Calculate your own figure using twelve months of recurring fees plus per-camper charges, amortised setup, and any payment surcharge, divided by enrolment. That number is comparable between vendors; a monthly price is not."
        }
      ]
    }
  ]
};

export default article;
