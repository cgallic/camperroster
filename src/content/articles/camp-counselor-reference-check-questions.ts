import type { Article } from "./types";

const article: Article = {
  slug: "camp-counselor-reference-check-questions",
  title: "Camp Counselor Reference Check Questions That Actually Tell You Something",
  metaTitle: "Camp Counselor Reference Check Questions",
  description:
    "Most camp reference calls produce nothing usable because of how they are asked. Here are the questions that surface real information, and how to document the answers for accreditation.",
  published: "2026-09-16",
  category: "Staffing",
  readMinutes: 8,
  related: [
    { href: "/camp-volunteer-reference-check-software", label: "How automated reference calling works" },
    { href: "/summer-camp-management-software", label: "Camp registration and operations in one system" }
  ],
  body: [
    {
      type: "p",
      text: "A camp hiring 60 seasonal staff needs roughly 180 reference calls. At three attempts per reference — which is normal, because references are at work when you call — that is well over 400 dial attempts crammed into February and March, done by a director who is also building a schedule and answering parent email."
    },
    {
      type: "p",
      text: "So the calls get compressed. The director reaches someone, asks whether the candidate was reliable, hears \"yes, they were great,\" writes \"positive\" in a spreadsheet, and moves on. The file is complete. The reference check did nothing."
    },
    {
      type: "p",
      text: "The problem is rarely effort. It is that the standard questions are built to be answered with a yes."
    },
    { type: "h2", text: "Why \"was he reliable?\" fails" },
    {
      type: "p",
      text: "A closed question hands the reference a script. They say yes because yes is polite, yes is fast, and yes carries no liability. You learn nothing, and you have no way to tell the difference between a reference who is enthusiastic and one who is relieved the candidate is now your problem."
    },
    {
      type: "p",
      text: "Three shifts fix most of this. Ask for a specific incident rather than a general trait. Ask about the conditions your camp actually creates — fatigue, homesickness at 11pm, a cabin that will not settle. And ask one question the reference has to think about, because the pause before the answer is usually the most informative part of the call."
    },
    { type: "h2", text: "The questions worth asking" },
    {
      type: "h3",
      text: "1. \"Tell me about a time this person was responsible for someone else's safety.\""
    },
    {
      type: "p",
      text: "This is the question that matters most and the one most often skipped. You are not hiring an employee, you are hiring a person who will be the only adult in a cabin at 2am. If the reference cannot produce a single concrete instance, that is an answer."
    },
    { type: "h3", text: "2. \"What did they do when they were exhausted?\"" },
    {
      type: "p",
      text: "Camp is a fatigue job. Week one, most staff are excellent. Week five is the real test. A reference who has seen the candidate tired — a closing shift, a double, an exam period — will tell you something a reference who has only seen them fresh cannot."
    },
    { type: "h3", text: "3. \"How did they handle being corrected?\"" },
    {
      type: "p",
      text: "Seasonal staff get corrected constantly, often in public, often by someone two years older. A candidate who takes correction badly will not surface in an interview, but a former supervisor will remember it immediately."
    },
    {
      type: "h3",
      text: "4. \"Was there anything about their judgment you had to coach?\""
    },
    {
      type: "p",
      text: "This gives permission to say something mildly negative, which is the only way most references will say anything negative at all. \"Had to coach\" is a softer frame than \"weakness,\" and it usually produces a real answer."
    },
    {
      type: "h3",
      text: "5. \"Would you leave this person alone with your own child for a weekend?\""
    },
    {
      type: "p",
      text: "Blunt, and it should be near the end of the call. Listen to the speed of the answer more than the content. An immediate yes and a hesitant yes are different data."
    },
    { type: "h3", text: "6. \"Is there anything I should have asked you that I didn't?\"" },
    {
      type: "p",
      text: "Close every call with this. It is the single highest-yield question in reference checking, because it puts the burden of disclosure on the person who actually knows."
    },
    {
      type: "callout",
      title: "Ask every candidate the same questions, in the same order",
      text: "Unstructured reference calls are not comparable to each other, which means they cannot be used to decide between two candidates — and they are much harder to defend if a hiring decision is ever questioned. A fixed script is not bureaucracy. It is the thing that makes the answers mean something."
    },
    { type: "h2", text: "What to write down" },
    {
      type: "p",
      text: "\"Positive\" is not a record. If you are accredited, or ever intend to be, your staff files need to show that a check happened, who was reached, when, and what was actually said. A usable record has five fields:"
    },
    {
      type: "ol",
      items: [
        "**Who you spoke to** — name, their relationship to the candidate, and how they know them. A reference who supervised the candidate is worth more than one who worked beside them.",
        "**When** — date and time of the completed call, not the date you first tried.",
        "**The questions asked** — the same set, every time.",
        "**What they said** — quoted, not summarized. \"He needed reminding about phone use\" is evidence. \"Minor concerns\" is not.",
        "**Your decision and why** — the sentence that connects the call to the hire."
      ]
    },
    {
      type: "p",
      text: "This matters beyond accreditation. The most common failure is not a bad reference that got ignored; it is a reference who mentioned something in passing in March that nobody wrote down, and that nobody remembered in July when it mattered."
    },
    { type: "h2", text: "The unreachable-reference problem" },
    {
      type: "p",
      text: "Most references are not avoiding you. They are at work, their phone screens unknown numbers, and your call comes during their shift. The usual outcome is that a director tries twice, runs out of March, and hires the candidate on two references instead of three."
    },
    {
      type: "p",
      text: "A few things help, none of them technology. Tell the candidate to warn their references that a call is coming, and from what number. Offer a two-hour window instead of an open-ended \"sometime this week.\" And call outside business hours, because that is when the people you want to reach are actually free — which is also, of course, when your own staff are not."
    },
    {
      type: "p",
      text: "That last constraint is the real one. Reference checking is a task that has to happen at the exact hours the person doing it is least available, during the eight weeks a director has the least time."
    },
    {
      type: "cta",
      title: "Or stop making the calls yourself",
      text: "CamperRoster calls each reference automatically, asks the same structured questions every time, and returns a transcript and a score to the candidate's file. Directors get the answers without spending March on the phone.",
      href: "/camp-volunteer-reference-check-software",
      label: "See how automated reference calls work"
    },
    { type: "h2", text: "Questions to drop" },
    {
      type: "ul",
      items: [
        "**\"Would you rehire?\"** — Many organizations have a policy forbidding any answer but yes or no, so it produces a data point with no content.",
        "**\"What are their weaknesses?\"** — Almost always answered with a disguised strength. Ask what had to be coached instead.",
        "**\"Rate them 1 to 10.\"** — Everyone says 8. It feels like data and is not.",
        "**Anything you can verify yourself** — employment dates and job titles do not need a human on the phone."
      ]
    },
    {
      type: "faq",
      items: [
        {
          q: "How many references should a camp counselor provide?",
          a: "Three is the common standard, and at least one should be someone who supervised the candidate rather than worked alongside them. Peer references are easy to collect and weak as evidence."
        },
        {
          q: "Can a former employer legally say something negative?",
          a: "Yes. The widespread belief that employers may only confirm dates of employment is a policy choice at many companies, not a legal rule. Many smaller employers and volunteer supervisors will speak freely if you ask a specific question."
        },
        {
          q: "Do reference checks replace a background check?",
          a: "No. They answer different questions. A background check surfaces record history; a reference tells you how someone behaved in a role. Requirements for criminal background screening vary substantially by state and by camp type, so confirm your own jurisdiction's rules with your state licensing agency."
        },
        {
          q: "When should camps start reference checks?",
          a: "Start with the hiring wave, typically January through March, and finish before staff training. Checks completed after a candidate has been told they are hired rarely change anything."
        }
      ]
    }
  ]
};

export default article;
