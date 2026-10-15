import { notFound } from "next/navigation";
import StaffNavigation from "@/components/StaffNavigation";
import { navigationForRole } from "@/lib/staff-navigation";
import { buildTriageItems, campersDisplayCount, volsDisplayCount } from "@/app/admin/triage";
import AdminDashboardClient from "@/app/admin/AdminDashboardClient";
import CabinBoardClient from "@/app/admin/cabins/CabinBoardClient";
import EmarClient from "@/app/nurse/emar/EmarClient";
import CanteenPosClient from "@/app/canteen/pos/CanteenPosClient";
import CounselorRosterClient from "@/app/counselor/CounselorRosterClient";
import CheckinClient from "@/app/admin/checkin/CheckinClient";
import BunkNotesClient from "@/app/admin/bunk-notes/BunkNotesClient";
import ImportClient from "@/app/admin/import/ImportClient";
import { demoCabins, demoCampers, demoStaff } from "@/lib/demo/fixtures";

/**
 * Screenshot harness. Renders the real staff screens around the demo camp's
 * fixture data so scripts/capture-screenshots.ts can photograph them without a
 * database. The browser-side API calls those screens make are answered by the
 * capture script. 404s unless the server was started with SCREENSHOT_MODE=1,
 * so it never exists in production.
 */
export const dynamic = "force-dynamic";

const SCREENS: Record<string, () => React.ReactNode> = {
  admin: () => {
    const health = demoCampers
      .filter((c) => c.allergy)
      .map((c) => ({
        id: c.healthId, camper_id: c.camperId, has_allergies: true, allergy_details: c.allergy!.details,
        has_epipen: Boolean(c.allergy!.epipen), epipen_location: c.allergy!.epipen ?? null,
        campers: { legal_first_name: c.first, legal_last_name: c.last, grade_entering: c.grade },
      }));
    const refs = demoStaff
      .filter((s) => s.reference)
      .map((s) => ({
        id: s.reference!.id, reference_name: s.reference!.name, relationship: s.reference!.relationship, phone: s.reference!.phone,
        sentiment_score: s.reference!.score, call_transcript: s.reference!.transcript,
        staff_applications: { first_name: s.first, last_name: s.last, role_applied: s.role },
      }));
    return (
      <AdminDashboardClient
        initialCampersCount={campersDisplayCount(demoCampers.length)}
        initialVolsCount={volsDisplayCount(demoStaff.length)}
        initialTriageItems={buildTriageItems(health, refs)}
      />
    );
  },
  cabins: () => (
    <CabinBoardClient
      initialCabins={demoCabins.map((cabin) => {
        const occupants = demoCampers.filter((c) => c.cabinId === cabin.id);
        return {
          cabinId: cabin.id, name: cabin.name, gender: cabin.gender, minGrade: cabin.min_grade, maxGrade: cabin.max_grade,
          capacity: cabin.capacity, isOpen: true, campersAssigned: occupants.length, spotsRemaining: cabin.capacity - occupants.length,
          occupants: occupants.map((c) => ({ assignmentId: c.assignmentId, registrationId: c.registrationId, staffApplicationId: null, name: c.legalName, grade: c.grade, role: "camper" as const })),
        };
      })}
      initialWaitlist={[]}
    />
  ),
  emar: () => <EmarClient />,
  pos: () => <CanteenPosClient />,
  counselor: () => <CounselorRosterClient />,
  checkin: () => <CheckinClient />,
  "bunk-notes": () => <BunkNotesClient />,
  import: () => <ImportClient />,
};

export default async function DemoPreview({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  const render = SCREENS[screen];
  if (process.env.SCREENSHOT_MODE !== "1" || !render) notFound();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2 border-b border-stone-100 py-2">
            <span className="font-display text-sm font-black tracking-tight text-forest-950">CamperRoster</span>
            <span className="rounded-full border border-forest-100 bg-forest-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-forest-800">
              Camp Willow Creek (Demo)
            </span>
          </div>
          <StaffNavigation items={navigationForRole("director")} />
        </div>
      </header>
      {render()}
    </>
  );
}
