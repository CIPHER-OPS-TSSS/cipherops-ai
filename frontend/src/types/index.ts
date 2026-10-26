export type RoleType =
  | 'SYSTEM_ADMINISTRATOR'
  | 'INVESTIGATION_SUPERVISOR'
  | 'INVESTIGATOR'
  | 'RECORDS_OFFICER'
  | 'FORENSIC_ANALYST'
  | 'READ_ONLY_AUDITOR';

export type CaseStatus =
  | 'DRAFT'
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'UNDER_INVESTIGATION'
  | 'AWAITING_FORENSIC_RESULTS'
  | 'AWAITING_LEGAL_REVIEW'
  | 'PENDING_COURT_PROCEEDINGS'
  | 'CLOSED'
  | 'REOPENED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PersonLegalRole =
  | 'CONVICTED'
  | 'ACCUSED'
  | 'SUSPECT'
  | 'WITNESS'
  | 'COMPLAINANT'
  | 'VICTIM'
  | 'PERSON_OF_INTEREST'
  | 'OTHER_INVOLVED_PARTY';

export interface User {
  id: string;
  email: string;
  badgeNumber: string;
  fullName: string;
  role: RoleType;
  department: string;
  permissions: string[];
}

export interface Case {
  id: string;
  caseNumber: string;
  firNumber?: string | null;
  title: string;
  description: string;
  policeStation: string;
  jurisdiction: string;
  status: CaseStatus;
  priority: CasePriority;
  incidentDate: string;
  reportedDate: string;
  statutorySections: string[];
  courtReferences?: string | null;
  isSensitive: boolean;
  assignedInvestigator?: User | null;
  supervisingOfficer?: User | null;
  evidenceCount?: number;
  incidentCount?: number;
  documentCount?: number;
  linkedPersons?: any[];
  linkedIncidents?: any[];
  linkedEvidence?: any[];
  linkedDocuments?: any[];
  timeline?: any[];
  tasks?: any[];
  relationships?: any[];
  courtProceedings?: any[];
}

export interface Person {
  id: string;
  recordNumber: string;
  fullName: string;
  aliases: string[];
  dateOfBirth?: string | null;
  gender?: string | null;
  nationalIdMasked?: string | null;
  contactNumber?: string | null;
  currentAddress?: string | null;
  identifyingMarks: string[];
  primaryLegalRole: PersonLegalRole;
  verificationStatus: string;
  sourceOfInfo: string;
  associatedCasesCount?: number;
  linkedCases?: any[];
}

export interface Location {
  id: string;
  locationName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  locationType: string;
  jurisdiction: string;
  geocodingConfidence: number;
  isApproximate: boolean;
  verificationStatus: string;
  incidentCount?: number;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  category: string;
  description: string;
  occurredAt: string;
  reportedAt: string;
  severity: string;
  caseId?: string | null;
  locationId?: string | null;
  case?: Case | null;
  location?: Location | null;
  distanceKm?: number;
}

export interface EvidenceItem {
  id: string;
  evidenceNumber: string;
  caseId: string;
  category: string;
  description: string;
  collectionDateTime: string;
  collectionLocation: string;
  storageLocation: string;
  currentCustodianName: string;
  barcode: string;
  sha256Hash?: string | null;
  sealReference?: string | null;
  status: string;
  case?: Case | null;
  custodyEventCount?: number;
  custodyEvents?: CustodyEvent[];
  isChainValid?: boolean;
}

export interface CustodyEvent {
  id: string;
  evidenceId: string;
  timestamp: string;
  transferReason: string;
  transferLocation: string;
  authorizationNote?: string | null;
  previousCustodianName: string;
  newCustodianName: string;
  previousHash: string;
  currentHash: string;
}

export interface Document {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  sha256Hash: string;
  extractedText?: string | null;
  pageCount: number;
  processingStatus: string;
  ocrPerformed: boolean;
  retentionCategory: string;
  createdAt: string;
  linkedCases?: Case[];
  chunks?: any[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userBadge?: string | null;
  userName?: string | null;
  action: string;
  targetResource: string;
  details: string;
  ipAddress?: string | null;
  previousHash: string;
  recordHash: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  caseId?: string | null;
  case?: Case | null;
  assignedTo?: User | null;
  createdBy?: User | null;
  createdAt: string;
}
