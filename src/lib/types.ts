export interface Camper {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName?: string;
  dob: string;
  gender: 'male' | 'female';
  gradeEntering: number;
  homeAddress: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface HealthProfile {
  id: string;
  camperId: string;
  hasAllergies: boolean;
  allergyDetails?: string;
  hasEpipen: boolean;
  epipenLocation?: string;
  dailyMedications?: string;
  immunizationStatus: 'up_to_date' | 'exempt' | 'pending_review';
  specialCareNotes?: string;
}

export interface InsuranceRecord {
  id: string;
  camperId: string;
  carrier: string;
  memberId: string;
  groupNumber: string;
  cardFrontUrl?: string;
  cardBackUrl?: string;
}

export interface Registration {
  id: string;
  camperId: string;
  sessionId: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'cancelled';
  progressPercentage: number;
  cabinId?: string;
  buddyRequest?: string;
  totalTuitionCents: number;
  amountPaidCents: number;
  paymentPlan: 'pay_in_full' | 'deposit_only' | 'installment_3mo';
  signatureName: string;
  signatureTimestamp: string;
}

export interface VolunteerApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'cabin_counselor' | 'medical_nurse' | 'kitchen_support';
  status: 'applied' | 'reference_calling' | 'approved' | 'rejected';
  referenceName: string;
  referencePhone: string;
  referenceScore?: number;
  referenceTranscript?: string;
}
