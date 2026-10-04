/**
 * The made-up camp behind the public demo and the marketing screenshots.
 *
 * One source for both: scripts/demo-seed-sql.ts turns this into the SQL that
 * seeds the demo camp's rows, and the screenshot harness (/demo-preview, only
 * served when SCREENSHOT_MODE=1) feeds the same records to the real staff
 * screens. Every person, email and phone number here is fictional.
 *
 * Ids are fixed so re-running the seed updates rows in place instead of
 * piling up duplicates.
 */

const id = (group: number, n: number) =>
  `00000000-0000-4000-8000-${String(group).padStart(4, "0")}${String(n).padStart(8, "0")}`;

export const DEMO_IDS = {
  camp: id(1, 1),
  session: id(2, 1),
};

export const demoCamp = {
  id: DEMO_IDS.camp,
  slug: "demo",
  name: "Camp Willow Creek (Demo)",
  location: "Asheville, NC",
  director_name: "Dana Whitaker",
  director_email: "demo@camperroster.com",
};

export const demoSession = {
  id: DEMO_IDS.session,
  name: "Week 1 · Junior & Middle Camp",
  start_date: "2027-06-20",
  end_date: "2027-06-26",
  min_grade: 3,
  max_grade: 8,
  capacity: 48,
  price_cents: 52500,
  deposit_cents: 10000,
};

export const demoCabins = [
  { id: id(3, 1), name: "Cedar", gender: "male", min_grade: 3, max_grade: 5, capacity: 8, counselor: "Marcus Bell" },
  { id: id(3, 2), name: "Birch", gender: "female", min_grade: 3, max_grade: 5, capacity: 8, counselor: "Hannah Ortiz" },
  { id: id(3, 3), name: "Aspen", gender: "male", min_grade: 6, max_grade: 8, capacity: 8, counselor: "Eli Turner" },
  { id: id(3, 4), name: "Willow", gender: "female", min_grade: 6, max_grade: 8, capacity: 8, counselor: "Grace Kim" },
];

type DemoCamper = {
  first: string;
  last: string;
  preferred?: string;
  gender: "male" | "female";
  grade: number;
  birth: string;
  cabin: string;
  guardian: string;
  relation: string;
  balance: number;
  checkedIn: boolean;
  buddies?: string[];
  allergy?: { details: string; epipen?: string };
  meds?: { name: string; dosage: string; times: string[]; given?: string[] }[];
};

const campers: DemoCamper[] = [
  { first: "Oliver", last: "Hayes", gender: "male", grade: 4, birth: "2017-03-14", cabin: "Cedar", guardian: "Rachel Hayes", relation: "Mother", balance: 2500, checkedIn: true, buddies: ["Mateo Rivera"], allergy: { details: "Peanuts and tree nuts (anaphylactic)", epipen: "Health Lodge + counselor waist pack" } },
  { first: "Mateo", last: "Rivera", gender: "male", grade: 4, birth: "2017-07-02", cabin: "Cedar", guardian: "Luis Rivera", relation: "Father", balance: 1800, checkedIn: true, buddies: ["Oliver Hayes"] },
  { first: "Benjamin", last: "Clark", preferred: "Ben", gender: "male", grade: 5, birth: "2016-01-22", cabin: "Cedar", guardian: "Amy Clark", relation: "Mother", balance: 3000, checkedIn: false, meds: [{ name: "Methylphenidate", dosage: "10 mg tablet", times: ["08:00"], given: ["08:00"] }] },
  { first: "Noah", last: "Patel", gender: "male", grade: 3, birth: "2018-05-09", cabin: "Cedar", guardian: "Priya Patel", relation: "Mother", balance: 1500, checkedIn: true },
  { first: "Ava", last: "Lopez", gender: "female", grade: 5, birth: "2016-04-12", cabin: "Birch", guardian: "Maria Lopez", relation: "Mother", balance: 2500, checkedIn: true, buddies: ["Mia Chen"], meds: [{ name: "Cetirizine", dosage: "10 mg tablet", times: ["08:00"], given: ["08:00"] }] },
  { first: "Mia", last: "Chen", gender: "female", grade: 5, birth: "2016-09-30", cabin: "Birch", guardian: "David Chen", relation: "Father", balance: 2000, checkedIn: true, buddies: ["Ava Lopez"], allergy: { details: "Bee stings", epipen: "Health Lodge" } },
  { first: "Charlotte", last: "Brooks", preferred: "Charlie", gender: "female", grade: 4, birth: "2017-02-18", cabin: "Birch", guardian: "Jenna Brooks", relation: "Mother", balance: 1200, checkedIn: false },
  { first: "Emma", last: "Nguyen", gender: "female", grade: 3, birth: "2018-08-11", cabin: "Birch", guardian: "Thao Nguyen", relation: "Mother", balance: 2200, checkedIn: true, allergy: { details: "Dairy (lactose intolerant, not anaphylactic)" } },
  { first: "Lucas", last: "Wright", gender: "male", grade: 7, birth: "2014-06-25", cabin: "Aspen", guardian: "Tom Wright", relation: "Father", balance: 4000, checkedIn: true, meds: [{ name: "Albuterol inhaler", dosage: "2 puffs as needed before swim", times: ["13:30"] }] },
  { first: "Ethan", last: "Brown", gender: "male", grade: 6, birth: "2015-11-03", cabin: "Aspen", guardian: "Kelly Brown", relation: "Mother", balance: 2800, checkedIn: true },
  { first: "James", last: "Okafor", gender: "male", grade: 8, birth: "2013-12-19", cabin: "Aspen", guardian: "Ngozi Okafor", relation: "Mother", balance: 3500, checkedIn: false, allergy: { details: "Shellfish", epipen: "Health Lodge" } },
  { first: "Henry", last: "Sullivan", gender: "male", grade: 7, birth: "2014-03-07", cabin: "Aspen", guardian: "Mark Sullivan", relation: "Father", balance: 1000, checkedIn: true, meds: [{ name: "Insulin glargine", dosage: "12 units injection", times: ["21:00"] }, { name: "Blood glucose check", dosage: "Finger stick, log reading", times: ["07:30", "12:00", "17:30"], given: ["07:30", "12:00"] }] },
  { first: "Sophia", last: "Martinez", gender: "female", grade: 7, birth: "2014-10-15", cabin: "Willow", guardian: "Elena Martinez", relation: "Mother", balance: 3000, checkedIn: true, buddies: ["Isabella Reed"] },
  { first: "Isabella", last: "Reed", preferred: "Izzy", gender: "female", grade: 7, birth: "2014-08-21", cabin: "Willow", guardian: "Chris Reed", relation: "Father", balance: 2600, checkedIn: true, buddies: ["Sophia Martinez"], allergy: { details: "Gluten (celiac)" } },
  { first: "Amelia", last: "Foster", gender: "female", grade: 6, birth: "2015-05-28", cabin: "Willow", guardian: "Laura Foster", relation: "Mother", balance: 1500, checkedIn: false, meds: [{ name: "Sertraline", dosage: "25 mg tablet", times: ["08:00"], given: ["08:00"] }] },
  { first: "Harper", last: "Diaz", gender: "female", grade: 8, birth: "2013-04-04", cabin: "Willow", guardian: "Ana Diaz", relation: "Mother", balance: 2000, checkedIn: true },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ".");

export const demoCampers = campers.map((c, i) => {
  const n = i + 1;
  const [gFirst, ...gRest] = c.guardian.split(" ");
  const cabin = demoCabins.find((x) => x.name === c.cabin)!;
  return {
    ...c,
    camperId: id(10, n),
    guardianId: id(11, n),
    familyId: id(12, n),
    registrationId: id(13, n),
    healthId: id(14, n),
    assignmentId: id(15, n),
    cabinId: cabin.id,
    counselor: cabin.counselor,
    displayName: c.preferred ?? c.first,
    legalName: `${c.first} ${c.last}`,
    guardianFirst: gFirst,
    guardianLast: gRest.join(" "),
    guardianEmail: `${slug(c.guardian)}@example.com`,
    guardianPhone: `555-01${String(n).padStart(2, "0")}`,
  };
});

/** Today's medication passes, one row per scheduled dose. */
export function demoMedications(day: string) {
  let n = 0;
  return demoCampers.flatMap((c) =>
    (c.meds ?? []).flatMap((m) =>
      m.times.map((t) => {
        n += 1;
        const given = m.given?.includes(t);
        return {
          id: id(16, n),
          camperId: c.camperId,
          camperName: `${c.displayName} ${c.last}`,
          grade: c.grade,
          medication: m.name,
          dosage: m.dosage,
          scheduledTime: `${day}T${t}:00-04:00`,
          administeredAt: given ? `${day}T${t.slice(0, 3)}${String(Number(t.slice(3)) + 4).padStart(2, "0")}:00-04:00` : null,
          administeredBy: given ? "nurse.kelly@example.com" : "",
          notes: null as string | null,
        };
      })
    )
  );
}

export const demoStaff = [
  {
    id: id(20, 1), first: "Jordan", last: "Reyes", role: "Cabin Counselor", email: "jordan.reyes@example.com", birth: "2004-02-11",
    reference: { id: id(21, 1), name: "Pastor Mike Allen", relationship: "Youth pastor, 4 years", phone: "555-0201", score: 0.92,
      transcript: "Jordan has led our middle school small group for two years. Reliable, calm with kids, and the first to volunteer for setup. I would trust Jordan with my own children." },
  },
  {
    id: id(20, 2), first: "Taylor", last: "Simmons", role: "Lifeguard", email: "taylor.simmons@example.com", birth: "2005-07-30",
    reference: { id: id(21, 2), name: "Coach Linda Park", relationship: "Swim coach, 3 years", phone: "555-0202", score: 0.81,
      transcript: "Taylor is a strong swimmer and holds current certification. Occasionally late to early practices, but always prepared once there." },
  },
  {
    id: id(20, 3), first: "Riley", last: "Morgan", role: "Kitchen Staff", email: "riley.morgan@example.com", birth: "2003-11-02",
    reference: { id: id(21, 3), name: "Sam Ortega", relationship: "Former manager", phone: "555-0203", score: 0.64,
      transcript: "Riley worked our weekend shifts for a year. Good with food safety. We had one scheduling conflict that the director should ask about." },
  },
  { id: id(20, 4), first: "Casey", last: "Nolan", role: "Health Lodge Assistant", email: "casey.nolan@example.com", birth: "2002-05-19", reference: null },
];

export function demoBunkNotes(day: string) {
  const notes = [
    { camper: "Oliver Hayes", sender: "Rachel Hayes", relation: "Mom", message: "Hi buddy! Hope you caught a fish at the lake. Grandma says hi and the dog misses you. Love you to the moon!" },
    { camper: "Ava Lopez", sender: "Maria Lopez", relation: "Mom", message: "We are so proud of you for trying the climbing wall. Remember to wear sunscreen. Big hugs from all of us!" },
    { camper: "Henry Sullivan", sender: "Mark Sullivan", relation: "Dad", message: "Have the best week. Nurse Kelly has your snacks. Tell me everything about the canoe trip when you get home." },
    { camper: "Isabella Reed", sender: "Chris Reed", relation: "Dad", message: "Izzy! The cat knocked over your Lego castle again. Rebuilding it for you. Have fun with Sophia!" },
    { camper: "Noah Patel", sender: "Priya Patel", relation: "Mom", message: "First week of camp! You are going to do great. Make a new friend today and tell me their name." },
  ];
  return notes.map((x, i) => ({
    id: id(22, i + 1),
    camp_id: DEMO_IDS.camp,
    registration_id: demoCampers.find((c) => c.legalName === x.camper)?.registrationId ?? null,
    camper_name: x.camper,
    sender_name: x.sender,
    sender_relation: x.relation,
    message: x.message,
    delivery_date: day,
    created_at: `${day}T07:${String(10 + i * 7).padStart(2, "0")}:00Z`,
    printed: i > 2,
  }));
}
