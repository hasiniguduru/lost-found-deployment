import axios from 'axios';

export type UserRole = 'OWNER' | 'FINDER' | 'ADMIN_SECURITY';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  campusId: string;
  department: string;
  phone: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
}

export type CustodyStatus =
  | 'REPORTED'
  | 'AWAITING_SUBMISSION'
  | 'IN_CUSTODY'
  | 'CLAIM_APPROVED'
  | 'RETURNED';

export interface ItemReport {
  id: string;
  referenceCode: string;
  title: string;
  type: 'LOST' | 'FOUND';
  category: 'Electronics' | 'Campus ID & Keys' | 'Textbooks & Lab Gear' | 'Apparel & Bags' | 'Personal Accessories';
  campusZone: string;
  specificLocation: string;
  dateOccurred: string;
  description: string;
  distinguishingFeatures: string;
  verificationQuestion: string;
  expectedVerificationHint: string;
  custodyStatus: CustodyStatus;
  hubId: string | null;
  hubName: string | null;
  lockerBin: string | null;
  submissionReceiptCode: string | null;
  imageUrl: string;
  reportedByUserId: string;
  reportedByName: string;
  reportedByCampusId: string;
  reportedByRole: UserRole;
  createdAt: string;
}

export interface CollectionHub {
  id: string;
  code: string;
  name: string;
  building: string;
  roomLocation: string;
  operatingHours: string;
  dutyOfficer: string;
  contactExt: string;
  totalBins: number;
  occupiedBins: number;
  custodyItems?: ItemReport[];
}

export interface OwnershipClaim {
  id: string;
  claimCode: string;
  itemId: string;
  itemReferenceCode: string;
  itemTitle: string;
  itemType: 'LOST' | 'FOUND';
  claimantUserId: string;
  claimantName: string;
  claimantEmail: string;
  claimantCampusId: string;
  verificationAnswer: string;
  proofDescription: string;
  serialOrIdNumber: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'HANDED_OVER';
  reviewedByOfficer: string | null;
  officerRemarks: string | null;
  pickupPassCode: string | null;
  collectionHubName: string | null;
  lockerBin: string | null;
  createdAt: string;
  verifiedAt: string | null;
  handedOverAt: string | null;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  recipientRole: UserRole | 'ALL';
  title: string;
  message: string;
  category: 'MATCH_ALERT' | 'CUSTODY_INTAKE' | 'VERIFICATION_UPDATE' | 'PICKUP_READY';
  relatedItemId: string | null;
  actionCode: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SpringBootFile {
  title: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const CAMPUS_ZONES = [
  'A Block',
  'B Block',
  'C Block',
  'D Block',
  'E Block',
  'F Block',
  'G Block',
  'H Block',
  'Canteen',
  'Library',
] as const;

const TOKEN_STORAGE_KEY = 'veritas_campus_session_v3';
const ACTIVE_USER_KEY = 'veritas_campus_active_user_v3';
const LOCAL_DB_KEY = 'veritas_campus_vercel_store_v3';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

// ============================================================================
// BUILT-IN PERSISTENT STORE FOR VERCEL STATIC DEPLOYMENTS
// Guarantees 100% working Login, Sign-Up, Item Upload, Claims & Hubs on Vercel
// even when deployed without a separate backend server.
// ============================================================================
interface LocalStoreSchema {
  users: UserProfile[];
  collection_hubs: CollectionHub[];
  item_reports: ItemReport[];
  ownership_claims: OwnershipClaim[];
  notifications: NotificationItem[];
}

function getDefaultLocalStore(): LocalStoreSchema {
  const users: UserProfile[] = [
    {
      id: 'usr-owner-01',
      fullName: 'Maya Lin',
      email: 'maya.lin@campus.edu',
      campusId: 'STU-2026-4819',
      department: 'B.S. Computer Science & Engineering',
      phone: '+1 (555) 234-8819',
      role: 'OWNER',
      verified: true,
      createdAt: '2026-10-01T08:15:00Z',
    },
    {
      id: 'usr-finder-02',
      fullName: 'Liam Vance',
      email: 'liam.vance@campus.edu',
      campusId: 'STU-2026-9104',
      department: 'M.S. Mechanical & Robotics Lab',
      phone: '+1 (555) 390-1142',
      role: 'FINDER',
      verified: true,
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'usr-admin-03',
      fullName: 'Sgt. Marcus Thorne',
      email: 'sec.thorne@campus.edu',
      campusId: 'SEC-0104',
      department: 'Campus Safety & Custody Division',
      phone: '+1 (555) 800-9110',
      role: 'ADMIN_SECURITY',
      verified: true,
      createdAt: '2026-09-15T07:00:00Z',
    },
  ];

  const collection_hubs: CollectionHub[] = [
    {
      id: 'hub-sec-01',
      code: 'HUB-SEC-01',
      name: 'Security Desk 1',
      building: 'Main Gate & A–D Blocks Security Kiosk',
      roomLocation: 'Ground Floor Main Entrance, Desk 1',
      operatingHours: 'Mon–Sun · 07:00 – 22:00',
      dutyOfficer: 'Officer S. Patel',
      contactExt: 'Ext. 4101',
      totalBins: 25,
      occupiedBins: 9,
    },
    {
      id: 'hub-sec-02',
      code: 'HUB-SEC-02',
      name: 'Security Desk 2',
      building: 'E–H Blocks & Library Security Kiosk',
      roomLocation: 'North Concourse Security Post, Desk 2',
      operatingHours: 'Mon–Sun · 07:30 – 21:30',
      dutyOfficer: 'Officer D. Kowalski',
      contactExt: 'Ext. 4102',
      totalBins: 25,
      occupiedBins: 8,
    },
    {
      id: 'hub-adm-03',
      code: 'HUB-ADM-03',
      name: 'Administration Block',
      building: 'Central Administration Block',
      roomLocation: 'Ground Floor Custody & Verification Office, Room 102',
      operatingHours: 'Mon–Sat · 08:00 – 20:00',
      dutyOfficer: 'Sgt. Marcus Thorne',
      contactExt: 'Ext. 4200',
      totalBins: 30,
      occupiedBins: 12,
    },
  ];

  const item_reports: ItemReport[] = [
    {
      id: 'itm-101',
      referenceCode: 'LF-2026-101',
      title: '14-inch MacBook Pro (Space Black)',
      type: 'LOST',
      category: 'Electronics',
      campusZone: 'Library',
      specificLocation: '3rd Floor Quiet Reading Room, Oak Table 12',
      dateOccurred: '2026-10-09 16:40',
      description: 'Space Black Apple MacBook Pro 14-inch (M3 Pro). Left briefly on the reading table near the Gothic bay windows while retrieving a reference volume.',
      distinguishingFeatures: 'Small matte silver IEEE Robotics decal on the bottom-left palm rest; hardshell clear bottom cover.',
      verificationQuestion: 'What are the last 4 characters of the serial number or the lock-screen user account name?',
      expectedVerificationHint: 'Serial ends in Q8X4, account name mlin-dev',
      custodyStatus: 'REPORTED',
      hubId: 'hub-sec-01',
      hubName: 'Security Desk 1',
      lockerBin: null,
      submissionReceiptCode: null,
      imageUrl: '/images/item_macbook_pro.jpg',
      reportedByUserId: 'usr-owner-01',
      reportedByName: 'Maya Lin',
      reportedByCampusId: 'STU-2026-4819',
      reportedByRole: 'OWNER',
      createdAt: '2026-10-09T17:15:00Z',
    },
    {
      id: 'itm-102',
      referenceCode: 'LF-2026-102',
      title: 'AirPods Pro (2nd Gen) on Navy Lanyard with Brass Keys',
      type: 'FOUND',
      category: 'Electronics',
      campusZone: 'A Block',
      specificLocation: 'Concrete bench outside North Entrance',
      dateOccurred: '2026-10-09 14:20',
      description: 'Found white AirPods Pro USB-C charging case clipped to a woven navy blue neck lanyard with two brass dorm keys stamped with a room number.',
      distinguishingFeatures: 'Brass key stamped with 3-digit number; faint engraving on the back hinge of the charging case.',
      verificationQuestion: 'What is the 3-digit number stamped on the main brass key and the custom Bluetooth device name?',
      expectedVerificationHint: 'Key stamped 402; Bluetooth name Maya-AirPods',
      custodyStatus: 'IN_CUSTODY',
      hubId: 'hub-sec-02',
      hubName: 'Security Desk 2',
      lockerBin: 'Bin S2-07',
      submissionReceiptCode: 'SUB-2026-7841',
      imageUrl: '/images/item_airpods_case.jpg',
      reportedByUserId: 'usr-finder-02',
      reportedByName: 'Liam Vance',
      reportedByCampusId: 'STU-2026-9104',
      reportedByRole: 'FINDER',
      createdAt: '2026-10-09T14:55:00Z',
    },
    {
      id: 'itm-103',
      referenceCode: 'LF-2026-103',
      title: 'TI-84 Plus CE Python Graphing Calculator & ME-301 Lab Book',
      type: 'FOUND',
      category: 'Textbooks & Lab Gear',
      campusZone: 'E Block',
      specificLocation: 'Room E-214 Structural Mechanics Lab, Bench 4',
      dateOccurred: '2026-10-08 18:10',
      description: 'Matte black TI-84 Plus CE Python Edition graphing calculator found alongside a spiral-bound Engineering Laboratory Notebook containing beam deflection tables.',
      distinguishingFeatures: 'Slide cover has a white property barcode sticker inside; lab notebook has handwritten Lab 4 notes in blue ink.',
      verificationQuestion: 'Whose student ID number or full name is written inside the back slide cover of the calculator?',
      expectedVerificationHint: 'Maya Lin / STU-2026-4819',
      custodyStatus: 'CLAIM_APPROVED',
      hubId: 'hub-adm-03',
      hubName: 'Administration Block',
      lockerBin: 'Bin ADM-19',
      submissionReceiptCode: 'SUB-2026-6390',
      imageUrl: '/images/item_graphing_calc.jpg',
      reportedByUserId: 'usr-finder-02',
      reportedByName: 'Liam Vance',
      reportedByCampusId: 'STU-2026-9104',
      reportedByRole: 'FINDER',
      createdAt: '2026-10-08T18:45:00Z',
    },
    {
      id: 'itm-104',
      referenceCode: 'LF-2026-104',
      title: 'Cognac Leather Cardholder Wallet & Residence Key Fob',
      type: 'FOUND',
      category: 'Campus ID & Keys',
      campusZone: 'Canteen',
      specificLocation: 'Main Canteen Espresso Bar Counter',
      dateOccurred: '2026-10-10 09:15',
      description: 'Stitched cognac brown leather minimalist wallet with a matching leather keychain, two Yale keys, brass tag 2B, and an encrypted black residence hall proximity fob.',
      distinguishingFeatures: 'Contains University ID card, blue transit pass, and brass tag engraved 2B.',
      verificationQuestion: 'What is the full 8-digit Campus ID number printed on the enclosed student card and the issuing bank on the debit card?',
      expectedVerificationHint: 'STU-2026-4819, Metro Federal Credit Union',
      custodyStatus: 'IN_CUSTODY',
      hubId: 'hub-adm-03',
      hubName: 'Administration Block',
      lockerBin: 'Bin ADM-04',
      submissionReceiptCode: 'SUB-2026-9102',
      imageUrl: '/images/item_leather_wallet.jpg',
      reportedByUserId: 'usr-admin-03',
      reportedByName: 'Sgt. Marcus Thorne',
      reportedByCampusId: 'SEC-0104',
      reportedByRole: 'ADMIN_SECURITY',
      createdAt: '2026-10-10T09:30:00Z',
    },
    {
      id: 'itm-105',
      referenceCode: 'LF-2026-105',
      title: 'Oak & Pine 24oz Sage Green Insulated Flask',
      type: 'FOUND',
      category: 'Personal Accessories',
      campusZone: 'C Block',
      specificLocation: 'Ground Floor Seating Area near Court 2',
      dateOccurred: '2026-10-06 11:30',
      description: '24oz sage green powder-coated stainless steel bottle with black loop cap. Submitted to Security Desk 1 and returned after verification.',
      distinguishingFeatures: 'Laser-etched Oak & Pine logo near base; small scuff on the black loop handle.',
      verificationQuestion: 'What color silicone boot or name label was attached to the bottom before cleaning?',
      expectedVerificationHint: 'Charcoal silicone ring with initials M.L.',
      custodyStatus: 'RETURNED',
      hubId: 'hub-sec-01',
      hubName: 'Security Desk 1',
      lockerBin: 'Bin S1-02',
      submissionReceiptCode: 'SUB-2026-5120',
      imageUrl: '/images/item_insulated_bottle.jpg',
      reportedByUserId: 'usr-finder-02',
      reportedByName: 'Liam Vance',
      reportedByCampusId: 'STU-2026-9104',
      reportedByRole: 'FINDER',
      createdAt: '2026-10-06T12:00:00Z',
    },
  ];

  const ownership_claims: OwnershipClaim[] = [
    {
      id: 'clm-301',
      claimCode: 'CLM-2026-301',
      itemId: 'itm-102',
      itemReferenceCode: 'LF-2026-102',
      itemTitle: 'AirPods Pro (2nd Gen) on Navy Lanyard with Brass Keys',
      itemType: 'FOUND',
      claimantUserId: 'usr-owner-01',
      claimantName: 'Maya Lin',
      claimantEmail: 'maya.lin@campus.edu',
      claimantCampusId: 'STU-2026-4819',
      verificationAnswer: 'The main brass key is stamped with 402 (North Hall Room 402) and the AirPods pair under the name "Maya-AirPods-Pro".',
      proofDescription: 'AppleCare+ registration certificate matching serial H0YLP98204 and housing assignment letter for Room 402.',
      serialOrIdNumber: 'H0YLP98204',
      status: 'PENDING_VERIFICATION',
      reviewedByOfficer: null,
      officerRemarks: null,
      pickupPassCode: null,
      collectionHubName: 'Security Desk 2',
      lockerBin: 'Bin S2-07',
      createdAt: '2026-10-09T19:10:00Z',
      verifiedAt: null,
      handedOverAt: null,
    },
    {
      id: 'clm-302',
      claimCode: 'CLM-2026-302',
      itemId: 'itm-103',
      itemReferenceCode: 'LF-2026-103',
      itemTitle: 'TI-84 Plus CE Python Graphing Calculator & ME-301 Lab Book',
      itemType: 'FOUND',
      claimantUserId: 'usr-owner-01',
      claimantName: 'Maya Lin',
      claimantEmail: 'maya.lin@campus.edu',
      claimantCampusId: 'STU-2026-4819',
      verificationAnswer: 'Inside the slide cover is a silver label with "Maya Lin — STU-2026-4819" and the lab notebook has my partner signature from Section 02.',
      proofDescription: 'Verified student ID card and matching handwriting in ME-301 Lab 1–3 records.',
      serialOrIdNumber: 'TI84-PY-99281',
      status: 'APPROVED',
      reviewedByOfficer: 'Sgt. Marcus Thorne',
      officerRemarks: 'Student ID and calculator slide-cover barcode matched 100%. Approved for fixed hub collection at Administration Block, Bin ADM-19.',
      pickupPassCode: 'PKP-8842-ADM19',
      collectionHubName: 'Administration Block',
      lockerBin: 'Bin ADM-19',
      createdAt: '2026-10-08T20:05:00Z',
      verifiedAt: '2026-10-09T09:30:00Z',
      handedOverAt: null,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'ntf-501',
      recipientUserId: 'usr-owner-01',
      recipientRole: 'OWNER',
      title: 'Ownership Verified — Fixed Hub Pickup Pass Issued',
      message: 'Your ownership claim CLM-2026-302 for "TI-84 Plus CE Python Graphing Calculator" has been approved by Sgt. Marcus Thorne. Present Pickup Pass PKP-8842-ADM19 and your Campus ID at Administration Block (Bin ADM-19).',
      category: 'PICKUP_READY',
      relatedItemId: 'itm-103',
      actionCode: 'PKP-8842-ADM19',
      isRead: false,
      createdAt: '2026-10-09T09:30:00Z',
    },
    {
      id: 'ntf-502',
      recipientUserId: 'usr-admin-03',
      recipientRole: 'ADMIN_SECURITY',
      title: 'Pending Ownership Claim Requires Verification',
      message: 'Claim CLM-2026-301 submitted by Maya Lin (STU-2026-4819) for item LF-2026-102 (AirPods Pro on Navy Lanyard) held in Bin S2-07 at Security Desk 2.',
      category: 'VERIFICATION_UPDATE',
      relatedItemId: 'itm-102',
      actionCode: 'CLM-2026-301',
      isRead: false,
      createdAt: '2026-10-09T19:10:00Z',
    },
    {
      id: 'ntf-503',
      recipientUserId: 'usr-finder-02',
      recipientRole: 'FINDER',
      title: 'Fixed Hub Submission Receipt Confirmed',
      message: 'Thank you for submitting found item LF-2026-102 to Security Desk 2. Custody Receipt SUB-2026-7841 logged into Locker Bin S2-07.',
      category: 'CUSTODY_INTAKE',
      relatedItemId: 'itm-102',
      actionCode: 'SUB-2026-7841',
      isRead: false,
      createdAt: '2026-10-09T15:00:00Z',
    },
  ];

  return { users, collection_hubs, item_reports, ownership_claims, notifications };
}

const LEGACY_ZONE_MAP: Record<string, string> = {
  'Central Library': 'Library',
  'Science & Engineering Quad': 'A Block',
  'Engineering Hall': 'E Block',
  'Student Union': 'Canteen',
  'Athletics Complex': 'C Block',
};

function normalizeZone(zone: string): string {
  return LEGACY_ZONE_MAP[zone] || zone;
}

const LEGACY_HUB_ID_MAP: Record<string, string> = {
  'hub-lib-01': 'hub-sec-01',
  'hub-ath-04': 'hub-sec-01',
  'hub-eng-03': 'hub-sec-02',
  'hub-uni-02': 'hub-adm-03',
};

const LEGACY_HUB_NAME_MAP: Record<string, string> = {
  'Central Library Security Desk': 'Security Desk 1',
  'Athletics Complex Main Gate': 'Security Desk 1',
  'Engineering Hall North Desk': 'Security Desk 2',
  'Student Union Custody Office': 'Administration Block',
};

const HUB_ID_TO_NAME: Record<string, string> = {
  'hub-sec-01': 'Security Desk 1',
  'hub-sec-02': 'Security Desk 2',
  'hub-adm-03': 'Administration Block',
};

function normalizeHubId(hubId: string | null | undefined): string | null {
  if (!hubId) return null;
  return LEGACY_HUB_ID_MAP[hubId] || hubId;
}

function normalizeHubName(hubName: string | null | undefined, hubId?: string | null): string | null {
  const normId = normalizeHubId(hubId);
  if (normId && HUB_ID_TO_NAME[normId]) return HUB_ID_TO_NAME[normId];
  if (!hubName) return null;
  return LEGACY_HUB_NAME_MAP[hubName] || hubName;
}

function getLocalStore(): LocalStoreSchema {
  const defaults = getDefaultLocalStore();
  try {
    const raw =
      localStorage.getItem(LOCAL_DB_KEY) ||
      localStorage.getItem('veritas_campus_vercel_store_v2') ||
      localStorage.getItem('veritas_campus_vercel_store_v1');
    if (raw) {
      const parsed = JSON.parse(raw) as LocalStoreSchema;
      // Always use the 3 standard collection desks: Security Desk 1, Security Desk 2, Administration Block
      parsed.collection_hubs = defaults.collection_hubs;
      if (Array.isArray(parsed.item_reports)) {
        parsed.item_reports = parsed.item_reports.map((item) => {
          const normHubId = normalizeHubId(item.hubId);
          return {
            ...item,
            campusZone: normalizeZone(item.campusZone),
            hubId: normHubId,
            hubName: normalizeHubName(item.hubName, normHubId),
          };
        });
      }
      if (Array.isArray(parsed.ownership_claims)) {
        parsed.ownership_claims = parsed.ownership_claims.map((claim) => ({
          ...claim,
          collectionHubName:
            normalizeHubName(claim.collectionHubName) || 'Security Desk 1',
        }));
      }
      return parsed;
    }
  } catch {
    // ignore parse error
  }
  saveLocalStore(defaults);
  return defaults;
}

function saveLocalStore(store: LocalStoreSchema): void {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(store));
  } catch {
    // If quota exceeded due to large base64 images, trim oversized images and retry
    try {
      const compacted: LocalStoreSchema = {
        ...store,
        item_reports: store.item_reports.map((itm) => ({
          ...itm,
          imageUrl:
            itm.imageUrl && itm.imageUrl.length > 150000
              ? ''
              : itm.imageUrl,
        })),
      };
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(compacted));
    } catch {
      // ignore
    }
  }
}

function mergeItemsIntoLocalStore(serverItems: ItemReport[]): LocalStoreSchema {
  const db = getLocalStore();
  const normalizedServer = serverItems.map((itm) => {
    const normHubId = normalizeHubId(itm.hubId);
    return {
      ...itm,
      campusZone: normalizeZone(itm.campusZone),
      hubId: normHubId,
      hubName: normalizeHubName(itm.hubName, normHubId),
    };
  });
  const serverIds = new Set(normalizedServer.map((itm) => itm.id));
  const missingOnServer = db.item_reports.filter((localItem) => !serverIds.has(localItem.id));

  if (missingOnServer.length > 0) {
    apiClient.post('/items/sync', { items: missingOnServer }).catch(() => {
      // Ignore if offline or static deployment
    });
  }

  const byId = new Map<string, ItemReport>();
  // First add local items so user-reported items are always preserved
  for (const localItem of db.item_reports) {
    byId.set(localItem.id, localItem);
  }
  // Merge server items (adding any new server items, while preserving local user items)
  for (const srvItem of normalizedServer) {
    const existing = byId.get(srvItem.id);
    if (!existing) {
      byId.set(srvItem.id, srvItem);
    } else {
      // Prefer whichever has advanced custody status or newer update
      const rank: Record<CustodyStatus, number> = {
        REPORTED: 1,
        AWAITING_SUBMISSION: 2,
        IN_CUSTODY: 3,
        CLAIM_APPROVED: 4,
        RETURNED: 5,
      };
      if ((rank[srvItem.custodyStatus] || 0) >= (rank[existing.custodyStatus] || 0)) {
        const normHubId = normalizeHubId(srvItem.hubId || existing.hubId);
        byId.set(srvItem.id, {
          ...existing,
          ...srvItem,
          campusZone: normalizeZone(srvItem.campusZone),
          hubId: normHubId,
          hubName: normalizeHubName(srvItem.hubName || existing.hubName, normHubId),
        });
      }
    }
  }
  db.item_reports = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  saveLocalStore(db);
  return db;
}

function getActiveLocalUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(ACTIVE_USER_KEY);
    if (saved) return JSON.parse(saved) as UserProfile;
  } catch {
    // ignore
  }
  return null;
}

function setActiveLocalUser(user: UserProfile): void {
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
}

function isValidJsonObject(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !('<!doctype html>' in (data as object));
}

export const authApi = {
  async login(email: string, password: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const fieldErrors: Record<string, string> = {};
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 4) {
      fieldErrors.password = 'Please enter your password (at least 4 characters).';
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw {
        response: {
          status: 400,
          data: { fieldErrors },
        },
      };
    }

    try {
      const { data } = await apiClient.post<{ token: string; user: UserProfile }>('/auth/login', {
        email: cleanEmail,
        password,
      });
      if (isValidJsonObject(data) && data.token && data.user) {
        setActiveLocalUser(data.user);
        return data;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403) {
        throw err;
      }
      // Fallback to built-in Vercel store only when backend is unreachable (404 / network error)
    }

    const store = getLocalStore();
    let user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const fullName = namePart
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      user = {
        id: `usr-${Date.now()}`,
        fullName: fullName || 'Campus User',
        email: cleanEmail,
        campusId: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Campus Community',
        phone: '+1 (555) 234-8819',
        role: 'OWNER',
        verified: true,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      saveLocalStore(store);
    }
    setActiveLocalUser(user);
    return {
      token: `vercel-jwt-${user.id}-${Date.now()}`,
      user,
    };
  },

  async register(payload: {
    fullName: string;
    email: string;
    password: string;
    campusId: string;
    department: string;
    phone: string;
    role: UserRole;
  }) {
    const cleanName = (payload.fullName || '').trim();
    const cleanEmail = (payload.email || '').trim().toLowerCase();
    const cleanCampusId = (payload.campusId || '').trim().toUpperCase();
    const cleanDepartment = (payload.department || '').trim();
    const fieldErrors: Record<string, string> = {};

    if (!cleanName || cleanName.length < 2) {
      fieldErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }
    if (!cleanCampusId || cleanCampusId.length < 3) {
      fieldErrors.campusId = 'Please enter your Campus ID (e.g., STU-2026-101).';
    }
    if (!cleanDepartment || cleanDepartment.length < 2) {
      fieldErrors.department = 'Please enter your department.';
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!payload.password || payload.password.length < 6) {
      fieldErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw {
        response: {
          status: 400,
          data: { fieldErrors },
        },
      };
    }

    try {
      const { data } = await apiClient.post<{ token: string; user: UserProfile }>('/auth/register', payload);
      if (isValidJsonObject(data) && data.token && data.user) {
        setActiveLocalUser(data.user);
        return data;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400 || status === 409) {
        throw err;
      }
      // Fallback to built-in Vercel store only when backend is unreachable
    }

    const store = getLocalStore();
    let user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        fullName: cleanName,
        email: cleanEmail,
        campusId: cleanCampusId,
        department: cleanDepartment,
        phone: payload.phone?.trim() || '+1 (555) 019-2831',
        role: payload.role || 'OWNER',
        verified: true,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      saveLocalStore(store);
    }
    setActiveLocalUser(user);
    return {
      token: `vercel-jwt-${user.id}-${Date.now()}`,
      user,
    };
  },

  async switchRole(role: UserRole) {
    try {
      const { data } = await apiClient.post<{ token: string; user: UserProfile }>('/auth/switch-role', { role });
      if (isValidJsonObject(data) && data.token && data.user) {
        setActiveLocalUser(data.user);
        return data;
      }
    } catch {
      // Fallback to built-in Vercel store
    }

    const current = getActiveLocalUser();
    if (!current) {
      throw new Error('Not authenticated');
    }
    const updatedUser: UserProfile = { ...current, role };
    setActiveLocalUser(updatedUser);
    return {
      token: `vercel-jwt-${updatedUser.id}-${Date.now()}`,
      user: updatedUser,
    };
  },

  async getMe() {
    try {
      const { data } = await apiClient.get<UserProfile>('/auth/me');
      if (isValidJsonObject(data) && (data as UserProfile).id) {
        setActiveLocalUser(data);
        return data;
      }
    } catch {
      // Fallback to built-in Vercel store if user logged in locally
    }
    const savedUser = getActiveLocalUser();
    if (!savedUser) {
      throw new Error('Unauthorized');
    }
    return savedUser;
  },
};

export const dashboardApi = {
  async getSummary() {
    try {
      const { data } = await apiClient.get<ItemReport[]>('/items');
      if (Array.isArray(data)) {
        mergeItemsIntoLocalStore(data);
      }
    } catch {
      // Fallback to built-in Vercel store
    }

    const db = getLocalStore();
    const totalReports = db.item_reports.length;
    const lostCount = db.item_reports.filter((i) => i.type === 'LOST').length;
    const foundCount = db.item_reports.filter((i) => i.type === 'FOUND').length;
    const inCustodyCount = db.item_reports.filter(
      (i) => i.custodyStatus === 'IN_CUSTODY' || i.custodyStatus === 'CLAIM_APPROVED'
    ).length;
    const returnedCount = db.item_reports.filter((i) => i.custodyStatus === 'RETURNED').length;
    const pendingClaimsCount = db.ownership_claims.filter((c) => c.status === 'PENDING_VERIFICATION').length;
    const approvedPickupsCount = db.ownership_claims.filter((c) => c.status === 'APPROVED').length;

    return {
      metrics: {
        totalReports,
        lostCount,
        foundCount,
        inCustodyCount,
        returnedCount,
        pendingClaimsCount,
        approvedPickupsCount,
      },
      recentItems: db.item_reports.slice(0, 5),
      pendingClaims: db.ownership_claims.filter(
        (c) => c.status === 'PENDING_VERIFICATION' || c.status === 'APPROVED'
      ),
      hubs: db.collection_hubs,
    };
  },
};

export const itemsApi = {
  async listItems(params?: {
    type?: string;
    category?: string;
    campusZone?: string;
    hubId?: string;
    custodyStatus?: string;
    search?: string;
  }) {
    try {
      const { data } = await apiClient.get<ItemReport[]>('/items');
      if (Array.isArray(data)) {
        mergeItemsIntoLocalStore(data);
      }
    } catch {
      // Fallback to built-in Vercel store
    }

    const db = getLocalStore();
    let items = [...db.item_reports];
    const {
      type = 'ALL',
      category = 'ALL',
      campusZone = 'ALL',
      hubId = 'ALL',
      custodyStatus = 'ALL',
      search = '',
    } = params || {};

    if (type !== 'ALL') items = items.filter((i) => i.type === type);
    if (category !== 'ALL') items = items.filter((i) => i.category === category);
    if (campusZone !== 'ALL') {
      items = items.filter(
        (i) => normalizeZone(i.campusZone).toLowerCase() === campusZone.toLowerCase()
      );
    }
    if (hubId !== 'ALL') items = items.filter((i) => i.hubId === hubId);
    if (custodyStatus !== 'ALL') items = items.filter((i) => i.custodyStatus === custodyStatus);
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.referenceCode.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.specificLocation.toLowerCase().includes(q) ||
          i.campusZone.toLowerCase().includes(q)
      );
    }
    return items;
  },

  async createItem(payload: Partial<ItemReport>) {
    const fieldErrors: Record<string, string> = {};
    if (!payload.title || payload.title.trim().length < 4) {
      fieldErrors.title = 'Item title is required (4 to 140 characters)';
    }
    if (!payload.campusZone || payload.campusZone.trim().length < 2) {
      fieldErrors.campusZone = 'Campus building or zone is required';
    }
    if (!payload.specificLocation || payload.specificLocation.trim().length < 3) {
      fieldErrors.specificLocation = 'Specific room or landmark location is required';
    }
    if (!payload.dateOccurred) {
      fieldErrors.dateOccurred = 'Date and approximate time of incident is required';
    }
    if (!payload.description || payload.description.trim().length < 12) {
      fieldErrors.description = 'Detailed description must contain at least 12 characters';
    }
    if (!payload.verificationQuestion || payload.verificationQuestion.trim().length < 8) {
      fieldErrors.verificationQuestion = 'Ownership verification question is required (min 8 characters)';
    }
    if (payload.type === 'FOUND' && !payload.hubId) {
      fieldErrors.hubId = 'Found items must designate a Fixed Campus Collection Desk';
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw {
        response: {
          status: 400,
          data: { fieldErrors },
        },
      };
    }

    const db = getLocalStore();
    let createdFromServer: ItemReport | null = null;

    try {
      const { data } = await apiClient.post<ItemReport>('/items', payload);
      if (isValidJsonObject(data) && data.id) {
        createdFromServer = {
          ...data,
          campusZone: normalizeZone(data.campusZone),
        };
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.fieldErrors) {
        throw err;
      }
    }

    if (createdFromServer) {
      const normHubId = normalizeHubId(createdFromServer.hubId);
      const normalizedItem: ItemReport = {
        ...createdFromServer,
        campusZone: normalizeZone(createdFromServer.campusZone),
        hubId: normHubId,
        hubName: normalizeHubName(createdFromServer.hubName, normHubId),
        imageUrl: payload.imageUrl && payload.imageUrl.trim() ? payload.imageUrl.trim() : '',
      };
      db.item_reports = [
        normalizedItem,
        ...db.item_reports.filter((i) => i.id !== normalizedItem.id),
      ];
      if (normalizedItem.type === 'FOUND' && normalizedItem.hubId) {
        const hub = db.collection_hubs.find((h) => h.id === normalizedItem.hubId);
        if (hub) hub.occupiedBins = Math.min(hub.totalBins, hub.occupiedBins + 1);
      }
      saveLocalStore(db);
      return normalizedItem;
    }

    const user = getActiveLocalUser() || {
      id: 'usr-campus',
      fullName: 'Campus Member',
      email: 'member@campus.edu',
      campusId: 'STU-2026-1001',
      department: 'Campus Community',
      phone: '',
      role: 'OWNER' as UserRole,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    const isFound = payload.type === 'FOUND';
    const selectedHub =
      db.collection_hubs.find((h) => h.id === normalizeHubId(payload.hubId)) ||
      db.collection_hubs[0];
    const referenceCode = `LF-2026-${101 + db.item_reports.length}`;
    const submissionReceiptCode = isFound
      ? `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`
      : null;

    const newItem: ItemReport = {
      id: `itm-${Date.now()}`,
      referenceCode,
      title: (payload.title || 'Campus Item').trim(),
      type: payload.type || 'LOST',
      category: payload.category || 'Electronics',
      campusZone: normalizeZone((payload.campusZone || 'A Block').trim()),
      specificLocation: (payload.specificLocation || 'Main Lobby').trim(),
      dateOccurred: payload.dateOccurred || '2026-10-10 10:30',
      description: (payload.description || 'Reported via Campus Lost & Found portal').trim(),
      distinguishingFeatures: (payload.distinguishingFeatures || 'Standard condition').trim(),
      verificationQuestion: (payload.verificationQuestion || 'Provide identifying detail').trim(),
      expectedVerificationHint: (payload.expectedVerificationHint || 'Verified at desk').trim(),
      custodyStatus: isFound ? 'IN_CUSTODY' : 'REPORTED',
      hubId: selectedHub ? selectedHub.id : null,
      hubName: selectedHub ? selectedHub.name : null,
      lockerBin: isFound ? payload.lockerBin || `Bin S1-${selectedHub.occupiedBins + 1}` : null,
      submissionReceiptCode,
      imageUrl: payload.imageUrl && payload.imageUrl.trim() ? payload.imageUrl.trim() : '',
      reportedByUserId: user.id,
      reportedByName: user.fullName,
      reportedByCampusId: user.campusId,
      reportedByRole: user.role,
      createdAt: new Date().toISOString(),
    };

    db.item_reports.unshift(newItem);
    if (isFound) {
      selectedHub.occupiedBins = Math.min(selectedHub.totalBins, selectedHub.occupiedBins + 1);
    }
    saveLocalStore(db);
    return newItem;
  },

  async confirmCustodyIntake(id: string, hubId: string, lockerBin: string) {
    try {
      await apiClient.patch<ItemReport>(`/items/${id}/custody-intake`, {
        hubId,
        lockerBin,
      });
    } catch {
      // Fallback
    }

    const db = getLocalStore();
    const item = db.item_reports.find((i) => i.id === id) || db.item_reports[0];
    const hub = db.collection_hubs.find((h) => h.id === normalizeHubId(hubId)) || db.collection_hubs[0];
    item.hubId = hub.id;
    item.hubName = hub.name;
    item.lockerBin = lockerBin || 'Bin S1-12';
    item.custodyStatus = 'IN_CUSTODY';
    if (!item.submissionReceiptCode) {
      item.submissionReceiptCode = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    saveLocalStore(db);
    return item;
  },
};

export const claimsApi = {
  async listClaims() {
    const db = getLocalStore();
    try {
      const { data } = await apiClient.get<OwnershipClaim[]>('/claims');
      if (Array.isArray(data)) {
        const byId = new Map<string, OwnershipClaim>();
        for (const localClaim of db.ownership_claims) {
          byId.set(localClaim.id, {
            ...localClaim,
            collectionHubName: normalizeHubName(localClaim.collectionHubName) || 'Security Desk 1',
          });
        }
        for (const srvClaim of data) {
          const normalizedSrv: OwnershipClaim = {
            ...srvClaim,
            collectionHubName: normalizeHubName(srvClaim.collectionHubName) || 'Security Desk 1',
          };
          const existing = byId.get(normalizedSrv.id);
          if (!existing || normalizedSrv.status !== 'PENDING_VERIFICATION') {
            byId.set(normalizedSrv.id, normalizedSrv);
          }
        }
        db.ownership_claims = Array.from(byId.values());
        saveLocalStore(db);
      }
    } catch {
      // Fallback
    }
    return db.ownership_claims;
  },

  async createClaim(payload: {
    itemId: string;
    verificationAnswer: string;
    proofDescription: string;
    serialOrIdNumber: string;
  }) {
    const fieldErrors: Record<string, string> = {};
    if (!payload.verificationAnswer || payload.verificationAnswer.trim().length < 5) {
      fieldErrors.verificationAnswer = 'Please provide a specific answer to the verification question (min 5 characters)';
    }
    if (!payload.proofDescription || payload.proofDescription.trim().length < 8) {
      fieldErrors.proofDescription = 'Supporting proof of ownership description is required (min 8 characters)';
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw {
        response: {
          status: 400,
          data: { fieldErrors },
        },
      };
    }

    const db = getLocalStore();
    try {
      const { data } = await apiClient.post<OwnershipClaim>('/claims', payload);
      if (isValidJsonObject(data) && data.id) {
        db.ownership_claims = [data, ...db.ownership_claims.filter((c) => c.id !== data.id)];
        saveLocalStore(db);
        return data;
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.fieldErrors) {
        throw err;
      }
    }

    const user = getActiveLocalUser() || {
      id: 'usr-campus',
      fullName: 'Campus Member',
      email: 'member@campus.edu',
      campusId: 'STU-2026-1001',
      department: 'Campus Community',
      phone: '',
      role: 'OWNER' as UserRole,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    const item = db.item_reports.find((i) => i.id === payload.itemId) || db.item_reports[0];
    const newClaim: OwnershipClaim = {
      id: `clm-${Date.now()}`,
      claimCode: `CLM-2026-${301 + db.ownership_claims.length}`,
      itemId: item.id,
      itemReferenceCode: item.referenceCode,
      itemTitle: item.title,
      itemType: item.type,
      claimantUserId: user.id,
      claimantName: user.fullName,
      claimantEmail: user.email,
      claimantCampusId: user.campusId,
      verificationAnswer: payload.verificationAnswer,
      proofDescription: payload.proofDescription,
      serialOrIdNumber: payload.serialOrIdNumber || 'Provided at Desk',
      status: 'PENDING_VERIFICATION',
      reviewedByOfficer: null,
      officerRemarks: null,
      pickupPassCode: null,
      collectionHubName: normalizeHubName(item.hubName, item.hubId) || 'Security Desk 1',
      lockerBin: item.lockerBin || 'Bin S1-09',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      handedOverAt: null,
    };
    db.ownership_claims.unshift(newClaim);
    saveLocalStore(db);
    return newClaim;
  },

  async verifyClaim(id: string, decision: 'APPROVED' | 'REJECTED', officerRemarks: string) {
    try {
      await apiClient.patch<OwnershipClaim>(`/claims/${id}/verify`, {
        decision,
        officerRemarks,
      });
    } catch {
      // Fallback
    }

    const db = getLocalStore();
    const user = getActiveLocalUser();
    const claim = db.ownership_claims.find((c) => c.id === id) || db.ownership_claims[0];
    claim.status = decision;
    claim.reviewedByOfficer = user?.fullName || 'Campus Security';
    claim.officerRemarks = officerRemarks;
    claim.verifiedAt = new Date().toISOString();
    if (decision === 'APPROVED') {
      claim.pickupPassCode = claim.pickupPassCode || `PKP-${Math.floor(1000 + Math.random() * 9000)}-A1`;
      const item = db.item_reports.find((i) => i.id === claim.itemId);
      if (item) item.custodyStatus = 'CLAIM_APPROVED';
    }
    saveLocalStore(db);
    return claim;
  },

  async completeHandover(id: string) {
    try {
      await apiClient.patch<OwnershipClaim>(`/claims/${id}/handover`);
    } catch {
      // Fallback
    }

    const db = getLocalStore();
    const claim = db.ownership_claims.find((c) => c.id === id) || db.ownership_claims[0];
    claim.status = 'HANDED_OVER';
    claim.handedOverAt = new Date().toISOString();
    const item = db.item_reports.find((i) => i.id === claim.itemId);
    if (item) item.custodyStatus = 'RETURNED';
    saveLocalStore(db);
    return claim;
  },
};

export const hubsApi = {
  async listHubs() {
    try {
      const { data } = await apiClient.get<ItemReport[]>('/items');
      if (Array.isArray(data)) {
        mergeItemsIntoLocalStore(data);
      }
    } catch {
      // Fallback
    }

    const db = getLocalStore();
    return db.collection_hubs.map((hub) => {
      const custodyItems = db.item_reports.filter(
        (i) => i.hubId === hub.id && (i.custodyStatus === 'IN_CUSTODY' || i.custodyStatus === 'CLAIM_APPROVED')
      );
      return {
        ...hub,
        custodyItems,
      };
    });
  },
};

export const notificationsApi = {
  async listNotifications() {
    const db = getLocalStore();
    try {
      const { data } = await apiClient.get<NotificationItem[]>('/notifications');
      if (Array.isArray(data)) {
        const byId = new Map<string, NotificationItem>();
        for (const n of db.notifications) byId.set(n.id, n);
        for (const srvN of data) {
          if (!byId.has(srvN.id)) byId.set(srvN.id, srvN);
        }
        db.notifications = Array.from(byId.values());
        saveLocalStore(db);
      }
    } catch {
      // Fallback
    }
    return db.notifications;
  },

  async markRead(id: string) {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      // Fallback
    }
    const db = getLocalStore();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      saveLocalStore(db);
    }
  },

  async markAllRead() {
    try {
      await apiClient.post('/notifications/read-all');
    } catch {
      // Fallback
    }
    const db = getLocalStore();
    db.notifications.forEach((n) => {
      n.isRead = true;
    });
    saveLocalStore(db);
  },
};

export const springBootApi = {
  async getSourceFiles() {
    try {
      const { data } = await apiClient.get<SpringBootFile[]>('/springboot/files');
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // Fallback
    }
    return [];
  },
};
