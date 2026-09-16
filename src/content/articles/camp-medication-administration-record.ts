import type { Article } from "./types";

const article: Article = {
  slug: "camp-medication-administration-record",
  title: "What Belongs on a Camp Medication Administration Record",
  metaTitle: "Camp Medication Administration Record (MAR)",
  description:
    "Generic MAR templates are built for nursing homes and break down at camp. Here is what a camp MAR needs, why paper fails on day one, and how to handle the missed dose you will eventually have.",
  published: "2026-09-16",
  category: "Health Lodge",
  readMinutes: 9,
  related: [
    { href: "/campdoc-alternative", label: "Health lodge eMAR without a per-camper fee" },
    { href: "/summer-camp-management-software", label: "Registration, health forms, and operations together" }
  ],
  body: [
    {
      type: "p",
      text: "Search for a medication administration record template and you will find forms designed for long-term care: one resident, one chart, a med cart that travels ten metres, and reliable wifi. Camp is none of those things. A camp nurse may administer 140 doses between 7:45 and 8:30am, outdoors, to children who are actively trying to get to breakfast, in a building where the signal drops."
    },
    {
      type: "p",
      text: "A MAR that works in a facility will not survive that. Here is what a camp version actually has to carry."
    },
    { type: "h2", text: "The fields a camp MAR needs" },
    {
      type: "table",
      head: ["Field", "Why camp specifically needs it"],
      rows: [
        ["Camper name and photo", "Morning med line moves fast and many camps have two children with the same first name. A photo on the record is the cheapest identity check available."],
        ["Cabin or unit", "The person who has to find a camper who missed a dose is not the nurse. It is whoever is nearest the cabin."],
        ["Drug, dose, route, time", "Standard, and non-negotiable."],
        ["Scheduled vs. as-needed", "PRN medication needs a reason recorded at the time of administration, not just a tick."],
        ["Who administered it", "Initials are not enough when you have summer staff rotating through the health lodge."],
        ["Parent-supplied vs. camp stock", "Determines who you call when it runs out mid-session."],
        ["Quantity checked in at arrival", "The only way to notice on day 9 that a 14-day supply is going to run out on day 11."],
        ["Missed and refused doses", "The most important field, and the one most templates leave out entirely."],
        ["Allergy and reaction flags", "Must be visible on the same screen as the dose, not on a separate form."]
      ]
    },
    {
      type: "callout",
      title: "Refused is not the same as missed",
      text: "A camper who spat out a dose, a camper who was on a hike at med time, and a camper the nurse could not find are three different events with three different follow-ups. A record that collapses them into one blank box cannot tell you which happened."
    },
    { type: "h2", text: "Why paper fails, specifically" },
    {
      type: "p",
      text: "Paper MARs are not wrong in principle. They fail at camp for four concrete reasons."
    },
    {
      type: "ol",
      items: [
        "**They live in one place.** The binder is in the health lodge. The camper is at the waterfront. The dose is due now.",
        "**They do not alert.** A missed dose on paper is a blank cell that someone has to notice. In practice nobody notices until the end of the week, or until a parent asks.",
        "**Handwriting compounds.** Six weeks of initials from rotating staff, in a humid building, is not a record anyone can reconstruct in November.",
        "**They cannot be counted.** \"How many doses of this did we give?\" is a question paper can only answer by someone sitting down and tallying."
      ]
    },
    {
      type: "p",
      text: "The instinct is to move to a spreadsheet. That solves legibility and nothing else, and it introduces a new problem: a shared spreadsheet holding children's medication data is health information sitting in a consumer file-sharing tool, usually with link access nobody has audited."
    },
    { type: "h2", text: "The offline requirement" },
    {
      type: "p",
      text: "This is where most general-purpose health software breaks at camp. Health lodges are frequently the oldest building on site, often the furthest from the router, and camps run in places chosen for being remote. A system that requires a live connection to log a dose will, at some point in July, refuse to log a dose."
    },
    {
      type: "p",
      text: "What happens next is predictable: the nurse writes it on a sticky note and enters it later. You now have a paper system with extra steps, and a gap between what happened and what the record says."
    },
    {
      type: "p",
      text: "A camp eMAR has to accept the entry locally and reconcile when the connection returns. This is not a premium feature. It is the difference between a record that reflects reality and one that reflects connectivity."
    },
    {
      type: "cta",
      title: "An eMAR built for a building with bad wifi",
      text: "CamperRoster's health lodge eMAR logs doses offline and syncs when the signal returns, keeps allergy flags on the administration screen, and does not charge a separate per-camper health fee.",
      href: "/campdoc-alternative",
      label: "See the health lodge eMAR"
    },
    { type: "h2", text: "Check-in day is where the record is won or lost" },
    {
      type: "p",
      text: "Almost every medication problem that shows up in week two was created in the ninety minutes of arrival day. Parents hand over bottles in ziplock bags. Some are unlabelled. Some contain a different quantity than the form says. A parent mentions a dose change verbally to a counsellor who is holding a suitcase."
    },
    {
      type: "p",
      text: "Three habits prevent most of it:"
    },
    {
      type: "ul",
      items: [
        "**Count at the gate and record the count.** Not \"received,\" but how many. This is what lets you predict a mid-session run-out.",
        "**Reconcile against the health form before the parent leaves.** A discrepancy is trivial to resolve while they are standing there and very hard to resolve on Tuesday.",
        "**Take verbal changes in writing.** Anything a parent says at the gate that differs from the form needs to be captured then, by the person hearing it, with their name on it."
      ]
    },
    { type: "h2", text: "Handling the missed dose" },
    {
      type: "p",
      text: "You will have one. Camps that pretend otherwise simply have unrecorded ones. What matters is that the process is decided in May, not improvised at 9pm in July by a nineteen-year-old."
    },
    {
      type: "p",
      text: "A workable protocol names, in advance: who is authorised to decide whether a late dose is given, the window beyond which a dose is skipped rather than given late, who contacts the parent and how quickly, and where the whole thing is written down. Attach it to the MAR itself so the person holding the record is holding the protocol."
    },
    {
      type: "p",
      text: "Follow your camp's licensed medical authority and your state's requirements for who may administer medication and under what delegation — those rules vary by jurisdiction and by camp type, and your camp physician or state licensing agency is the right source, not a template you found online."
    },
    {
      type: "faq",
      items: [
        {
          q: "What is a camp eMAR?",
          a: "An electronic medication administration record: the digital version of the paper med chart, holding each camper's scheduled and as-needed medication, every dose given, who gave it, and any missed or refused doses. The camp-specific requirements are offline logging, cabin visibility, and allergy flags on the administration screen."
        },
        {
          q: "Can camps use a generic MAR template?",
          a: "They can, but most generic templates are built for long-term care and omit the fields camp actually depends on: quantity received at check-in, refused-versus-missed distinction, and cabin assignment. Those omissions are what create the mid-session problems."
        },
        {
          q: "Who is allowed to give medication at camp?",
          a: "This varies by state, by camp licensing category, and by the medication involved. Confirm it with your camp's licensed medical authority and your state licensing agency rather than assuming a general rule applies."
        },
        {
          q: "How long should a camp keep medication records?",
          a: "Retention requirements are set by state law and by your accrediting body, and they differ for minors' health records. Ask your licensing agency for the figure that applies to you, and make sure the system you use can actually produce records for a past season."
        }
      ]
    }
  ]
};

export default article;
