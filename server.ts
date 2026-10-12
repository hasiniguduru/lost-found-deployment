import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'VeritasCampusLostAndFoundJwtSecretKey2026SecureHmacSha256';
const DB_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'campus-mysql-store.json')
  : path.resolve(process.cwd(), 'campus-mysql-store.json');

export type UserRole = 'OWNER' | 'FINDER' | 'ADMIN_SECURITY';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  campusId: string;
  department: string;
  phone: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
}

export interface CollectionHubRecord {
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
}

export type CustodyStatus =
  | 'REPORTED'
  | 'AWAITING_SUBMISSION'
  | 'IN_CUSTODY'
  | 'CLAIM_APPROVED'
  | 'RETURNED';

export interface ItemReportRecord {
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

export interface OwnershipClaimRecord {
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

export interface NotificationRecord {
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

interface DatabaseSchema {
  users: UserRecord[];
  collection_hubs: CollectionHubRecord[];
  item_reports: ItemReportRecord[];
  ownership_claims: OwnershipClaimRecord[];
  notifications: NotificationRecord[];
}

// ============================================================================
// JWT & PASSWORD HELPERS (Spring Security Stateless Filter Equivalent)
// ============================================================================
function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(plain + '_veritas_salt').digest('hex');
}

interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  campusId: string;
  department?: string;
  phone?: string;
  role: UserRole;
  iat: number;
  exp: number;
}

function createJwtToken(user: UserRecord): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payloadObj: JwtPayload = {
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    campusId: user.campusId,
    department: user.department,
    phone: user.phone,
    role: user.role,
    iat: now,
    exp: now + 86400,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtPayload;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

// ============================================================================
// INITIAL MYSQL SEED DATA
// ============================================================================
function getInitialSeedData(): DatabaseSchema {
  const users: UserRecord[] = [
    {
      id: 'usr-owner-01',
      fullName: 'Maya Lin',
      email: 'maya.lin@campus.edu',
      passwordHash: hashPassword('Campus2026!'),
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
      passwordHash: hashPassword('Campus2026!'),
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
      passwordHash: hashPassword('Security2026!'),
      campusId: 'SEC-0104',
      department: 'Campus Safety & Custody Division',
      phone: '+1 (555) 800-9110',
      role: 'ADMIN_SECURITY',
      verified: true,
      createdAt: '2026-09-15T07:00:00Z',
    },
  ];

  const collection_hubs: CollectionHubRecord[] = [
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

  const item_reports: ItemReportRecord[] = [
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
      imageUrl: '/src/assets/images/item_macbook_pro_1791631889271.jpg',
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
      specificLocation: 'Concrete bench outside Engineering Hall North Entrance',
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
      imageUrl: '/src/assets/images/item_airpods_case_1791631902470.jpg',
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
      imageUrl: '/src/assets/images/item_graphing_calc_1791631914094.jpg',
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
      specificLocation: 'Founders Commons Espresso Bar Counter',
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
      imageUrl: '/src/assets/images/item_leather_wallet_1791631936011.jpg',
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
      campusZone: 'B Block',
      specificLocation: 'Varsity Café Seating Area near Court 2',
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
      imageUrl: '/src/assets/images/item_insulated_bottle_1791631924764.jpg',
      reportedByUserId: 'usr-finder-02',
      reportedByName: 'Liam Vance',
      reportedByCampusId: 'STU-2026-9104',
      reportedByRole: 'FINDER',
      createdAt: '2026-10-06T12:00:00Z',
    },
  ];

  const ownership_claims: OwnershipClaimRecord[] = [
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

  const notifications: NotificationRecord[] = [
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

let memoryDbFallback: DatabaseSchema | null = null;

function normalizeServerZone(zone: string): string {
  const map: Record<string, string> = {
    'Central Library': 'Library',
    'Science & Engineering Quad': 'A Block',
    'Engineering Hall': 'E Block',
    'Student Union': 'Canteen',
    'Athletics Complex': 'B Block',
  };
  return map[zone] || zone;
}

const SERVER_LEGACY_HUB_ID_MAP: Record<string, string> = {
  'hub-lib-01': 'hub-sec-01',
  'hub-ath-04': 'hub-sec-01',
  'hub-eng-03': 'hub-sec-02',
  'hub-uni-02': 'hub-adm-03',
};

const SERVER_LEGACY_HUB_NAME_MAP: Record<string, string> = {
  'Central Library Security Desk': 'Security Desk 1',
  'Athletics Complex Main Gate': 'Security Desk 1',
  'Engineering Hall North Desk': 'Security Desk 2',
  'Student Union Custody Office': 'Administration Block',
};

const SERVER_HUB_ID_TO_NAME: Record<string, string> = {
  'hub-sec-01': 'Security Desk 1',
  'hub-sec-02': 'Security Desk 2',
  'hub-adm-03': 'Administration Block',
};

function normalizeServerHubId(hubId: string | null | undefined): string | null {
  if (!hubId) return null;
  return SERVER_LEGACY_HUB_ID_MAP[hubId] || hubId;
}

function normalizeServerHubName(hubName: string | null | undefined, hubId?: string | null): string | null {
  const normId = normalizeServerHubId(hubId);
  if (normId && SERVER_HUB_ID_TO_NAME[normId]) return SERVER_HUB_ID_TO_NAME[normId];
  if (!hubName) return null;
  return SERVER_LEGACY_HUB_NAME_MAP[hubName] || hubName;
}

function loadDb(): DatabaseSchema {
  const defaults = getInitialSeedData();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      parsed.collection_hubs = defaults.collection_hubs;
      if (Array.isArray(parsed.item_reports)) {
        parsed.item_reports = parsed.item_reports.map((item) => {
          const normHubId = normalizeServerHubId(item.hubId);
          return {
            ...item,
            campusZone: normalizeServerZone(item.campusZone),
            hubId: normHubId,
            hubName: normalizeServerHubName(item.hubName, normHubId),
          };
        });
      }
      if (Array.isArray(parsed.ownership_claims)) {
        parsed.ownership_claims = parsed.ownership_claims.map((claim) => ({
          ...claim,
          collectionHubName:
            normalizeServerHubName(claim.collectionHubName) || 'Security Desk 1',
        }));
      }
      memoryDbFallback = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error loading DB file, using fallback seed data:', err);
  }
  if (memoryDbFallback) {
    return memoryDbFallback;
  }
  saveDb(defaults);
  return defaults;
}

function saveDb(data: DatabaseSchema): void {
  memoryDbFallback = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore read-only filesystem error on serverless environments
  }
}

// ============================================================================
// EXPRESS SERVER & REST API ROUTES
// ============================================================================
export const app = express();
app.use(express.json({ limit: '15mb' }));
app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));

{

  // Request extension for authenticated user
  interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
  }

  function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'Missing or invalid JWT Authorization Bearer header',
      });
      return;
    }
    const token = authHeader.slice(7);
    const payload = verifyJwtToken(token);
    if (!payload) {
      res.status(401).json({
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'JWT token expired or signature verification failed',
      });
      return;
    }
    req.user = payload;
    next();
  }

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROLE SWITCHING ENDPOINTS (/api/v1/auth/*)
  // --------------------------------------------------------------------------
  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const fieldErrors: Record<string, string> = {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      fieldErrors.email = 'Valid institutional email address (@campus.edu) is required';
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      fieldErrors.password = 'Password is required (minimum 4 characters)';
    }
    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bean Validation Failed',
        fieldErrors,
      });
      return;
    }

    const db = loadDb();
    let user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      const namePart = email.trim().split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      user = {
        id: `usr-${Date.now()}`,
        fullName: formattedName || 'Campus User',
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        campusId: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Campus Community',
        phone: '+1 (555) 234-8819',
        role: 'OWNER',
        verified: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDb(db);
    }

    const token = createJwtToken(user);
    const { passwordHash: _, ...safeUser } = user;
    res.json({
      token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: safeUser,
    });
  });

  app.post('/api/v1/auth/register', (req: Request, res: Response) => {
    const { fullName, email, password, campusId, department, phone, role } = req.body;
    const fieldErrors: Record<string, string> = {};

    if (!fullName || fullName.trim().length < 3) {
      fieldErrors.fullName = 'Full name must be at least 3 characters';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = 'Must be a valid institutional email address';
    }
    if (!password || password.length < 6) {
      fieldErrors.password = 'Password must be at least 6 characters';
    }
    if (!campusId || campusId.trim().length < 4) {
      fieldErrors.campusId = 'University ID (e.g., STU-2026-XXXX or SEC-XXXX) is required';
    }
    if (!department || department.trim().length < 2) {
      fieldErrors.department = 'Academic department or unit is required';
    }
    if (!['OWNER', 'FINDER', 'ADMIN_SECURITY'].includes(role)) {
      fieldErrors.role = 'Role must be OWNER, FINDER, or ADMIN_SECURITY';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bean Validation Failed',
        fieldErrors,
      });
      return;
    }

    const db = loadDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      res.status(409).json({
        timestamp: new Date().toISOString(),
        status: 409,
        error: 'DataIntegrityViolationException',
        message: 'An account with this email already exists in the MySQL users table.',
      });
      return;
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      campusId: campusId.trim().toUpperCase(),
      department: department.trim(),
      phone: (phone || '+1 (555) 019-2831').trim(),
      role: role as UserRole,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = createJwtToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: safeUser,
    });
  });

  // Update only the current logged-in user's role (never switches to another user)
  app.post('/api/v1/auth/switch-role', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const { role } = req.body;
    const validRole: UserRole = ['OWNER', 'FINDER', 'ADMIN_SECURITY'].includes(role)
      ? (role as UserRole)
      : 'OWNER';
    const db = loadDb();
    let targetUser = db.users.find((u) => u.id === req.user?.sub);
    if (!targetUser && req.user) {
      targetUser = {
        id: req.user.sub,
        fullName: req.user.fullName,
        email: req.user.email,
        passwordHash: '',
        campusId: req.user.campusId,
        department: req.user.department || 'Campus Community',
        phone: req.user.phone || '+1 (555) 019-2831',
        role: validRole,
        verified: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(targetUser);
    } else if (targetUser) {
      targetUser.role = validRole;
    }
    saveDb(db);
    if (!targetUser) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const token = createJwtToken(targetUser);
    const { passwordHash: _, ...safeUser } = targetUser;
    res.json({
      token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: safeUser,
    });
  });

  app.get('/api/v1/auth/me', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.user?.sub);
    if (user) {
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
      return;
    }
    if (req.user) {
      res.json({
        id: req.user.sub,
        fullName: req.user.fullName,
        email: req.user.email,
        campusId: req.user.campusId,
        department: req.user.department || 'Campus Community',
        phone: req.user.phone || '+1 (555) 019-2831',
        role: req.user.role,
        verified: true,
        createdAt: new Date().toISOString(),
      });
      return;
    }
    res.status(404).json({ message: 'User not found' });
  });

  // --------------------------------------------------------------------------
  // 2. DASHBOARD SUMMARY METRICS (/api/v1/dashboard)
  // --------------------------------------------------------------------------
  app.get('/api/v1/dashboard', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const totalReports = db.item_reports.length;
    const lostCount = db.item_reports.filter((i) => i.type === 'LOST').length;
    const foundCount = db.item_reports.filter((i) => i.type === 'FOUND').length;
    const inCustodyCount = db.item_reports.filter((i) => i.custodyStatus === 'IN_CUSTODY' || i.custodyStatus === 'CLAIM_APPROVED').length;
    const returnedCount = db.item_reports.filter((i) => i.custodyStatus === 'RETURNED').length;
    const pendingClaimsCount = db.ownership_claims.filter((c) => c.status === 'PENDING_VERIFICATION').length;
    const approvedPickupsCount = db.ownership_claims.filter((c) => c.status === 'APPROVED').length;

    res.json({
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
      pendingClaims: db.ownership_claims.filter((c) => c.status === 'PENDING_VERIFICATION' || c.status === 'APPROVED'),
      hubs: db.collection_hubs,
    });
  });

  // --------------------------------------------------------------------------
  // 3. LOST & FOUND ITEM REPORTS (/api/v1/items)
  // --------------------------------------------------------------------------
  app.post('/api/v1/items/sync', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const { items } = req.body as { items?: ItemReportRecord[] };
    if (Array.isArray(items) && items.length > 0) {
      let changed = false;
      for (const incoming of items) {
        if (incoming && incoming.id && !db.item_reports.some((i) => i.id === incoming.id)) {
          db.item_reports.unshift({
            ...incoming,
            campusZone: normalizeServerZone(incoming.campusZone || 'Library'),
          });
          changed = true;
        }
      }
      if (changed) {
        db.item_reports.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveDb(db);
      }
    }
    res.json({ synced: true, total: db.item_reports.length });
  });

  app.get('/api/v1/items', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const {
      type = 'ALL',
      category = 'ALL',
      campusZone = 'ALL',
      hubId = 'ALL',
      custodyStatus = 'ALL',
      search = '',
    } = req.query as Record<string, string>;

    let items = [...db.item_reports];

    if (type !== 'ALL') {
      items = items.filter((item) => item.type === type);
    }
    if (category !== 'ALL') {
      items = items.filter((item) => item.category === category);
    }
    if (campusZone !== 'ALL') {
      items = items.filter((item) => item.campusZone.toLowerCase() === campusZone.toLowerCase());
    }
    if (hubId !== 'ALL') {
      items = items.filter((item) => item.hubId === hubId);
    }
    if (custodyStatus !== 'ALL') {
      items = items.filter((item) => item.custodyStatus === custodyStatus);
    }
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.referenceCode.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.specificLocation.toLowerCase().includes(q) ||
          item.campusZone.toLowerCase().includes(q) ||
          (item.submissionReceiptCode && item.submissionReceiptCode.toLowerCase().includes(q))
      );
    }

    res.json(items);
  });

  app.post('/api/v1/items', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      type,
      category,
      campusZone,
      specificLocation,
      dateOccurred,
      description,
      distinguishingFeatures,
      verificationQuestion,
      expectedVerificationHint,
      hubId,
      lockerBin,
      imageUrl,
    } = req.body;

    // Jakarta Bean Validation simulation
    const fieldErrors: Record<string, string> = {};
    if (!title || title.trim().length < 4) {
      fieldErrors.title = 'Item title is required (4 to 140 characters)';
    }
    if (!['LOST', 'FOUND'].includes(type)) {
      fieldErrors.type = 'Report type must be LOST or FOUND';
    }
    if (!category) {
      fieldErrors.category = 'Category selection is required';
    }
    if (!campusZone || campusZone.trim().length < 2) {
      fieldErrors.campusZone = 'Campus building or zone is required';
    }
    if (!specificLocation || specificLocation.trim().length < 3) {
      fieldErrors.specificLocation = 'Specific room or landmark location is required';
    }
    if (!dateOccurred) {
      fieldErrors.dateOccurred = 'Date and approximate time of incident is required';
    }
    if (!description || description.trim().length < 12) {
      fieldErrors.description = 'Detailed description must contain at least 12 characters';
    }
    if (!verificationQuestion || verificationQuestion.trim().length < 8) {
      fieldErrors.verificationQuestion = 'Ownership verification challenge question is required (min 8 characters)';
    }
    if (type === 'FOUND' && !hubId) {
      fieldErrors.hubId = 'Found items must designate a Fixed Campus Collection Hub for submission';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'MethodArgumentNotValidException',
        fieldErrors,
      });
      return;
    }

    const db = loadDb();
    const normHubId = normalizeServerHubId(hubId);
    const selectedHub =
      db.collection_hubs.find((h) => h.id === normHubId) || db.collection_hubs[0];
    const nextNum = 101 + db.item_reports.length;
    const referenceCode = `LF-2026-${nextNum}`;

    const isFound = type === 'FOUND';
    const submissionReceiptCode = isFound
      ? `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`
      : null;

    const assignedBin = isFound
      ? lockerBin?.trim() || `Bin ${selectedHub?.code.split('-')[1] || 'S1'}-${String((selectedHub?.occupiedBins || 1) + 1).padStart(2, '0')}`
      : null;

    const newItem: ItemReportRecord = {
      id: `itm-${Date.now()}`,
      referenceCode,
      title: title.trim(),
      type,
      category,
      campusZone: campusZone.trim(),
      specificLocation: specificLocation.trim(),
      dateOccurred,
      description: description.trim(),
      distinguishingFeatures: (distinguishingFeatures || 'Standard campus item condition').trim(),
      verificationQuestion: verificationQuestion.trim(),
      expectedVerificationHint: (expectedVerificationHint || 'Verified during security officer review').trim(),
      custodyStatus: isFound ? 'IN_CUSTODY' : 'REPORTED',
      hubId: selectedHub ? selectedHub.id : null,
      hubName: selectedHub ? selectedHub.name : null,
      lockerBin: assignedBin,
      submissionReceiptCode,
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : '',
      reportedByUserId: req.user!.sub,
      reportedByName: req.user!.fullName,
      reportedByCampusId: req.user!.campusId,
      reportedByRole: req.user!.role,
      createdAt: new Date().toISOString(),
    };

    if (isFound && selectedHub) {
      selectedHub.occupiedBins = Math.min(selectedHub.totalBins, selectedHub.occupiedBins + 1);
    }

    db.item_reports.unshift(newItem);

    // Create notification
    db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      recipientUserId: req.user!.sub,
      recipientRole: 'ALL',
      title: isFound
        ? `Found Item Logged & Assigned to ${selectedHub?.name}`
        : `Lost Item Report ${referenceCode} Broadcasted`,
      message: isFound
        ? `${newItem.title} (${referenceCode}) has been logged for fixed custody at ${selectedHub?.name} (${assignedBin}). Submission Receipt: ${submissionReceiptCode}.`
        : `${newItem.title} (${referenceCode}) reported lost near ${newItem.campusZone}. Campus Security desks have been alerted.`,
      category: isFound ? 'CUSTODY_INTAKE' : 'MATCH_ALERT',
      relatedItemId: newItem.id,
      actionCode: submissionReceiptCode || referenceCode,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    res.status(201).json(newItem);
  });

  // Confirm physical custody intake at a Fixed Collection Hub
  app.patch('/api/v1/items/:id/custody-intake', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { hubId, lockerBin } = req.body;
    const db = loadDb();
    const item = db.item_reports.find((i) => i.id === id);
    if (!item) {
      res.status(404).json({ message: 'Item report not found' });
      return;
    }

    const hub = db.collection_hubs.find((h) => h.id === hubId) || db.collection_hubs[0];
    item.hubId = hub.id;
    item.hubName = hub.name;
    item.lockerBin = lockerBin || `Bin ${hub.code.split('-')[1]?.[0] || 'A'}-${String(hub.occupiedBins + 1).padStart(2, '0')}`;
    item.custodyStatus = 'IN_CUSTODY';
    if (!item.submissionReceiptCode) {
      item.submissionReceiptCode = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      recipientUserId: item.reportedByUserId,
      recipientRole: 'ALL',
      title: `Fixed Collection Custody Intake Confirmed (${item.referenceCode})`,
      message: `Item "${item.title}" is now secured in ${item.lockerBin} at ${hub.name}. Receipt: ${item.submissionReceiptCode}.`,
      category: 'CUSTODY_INTAKE',
      relatedItemId: item.id,
      actionCode: item.submissionReceiptCode,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    res.json(item);
  });

  // --------------------------------------------------------------------------
  // 4. OWNERSHIP VERIFICATION CLAIMS & FIXED PICKUP HANDOVER (/api/v1/claims)
  // --------------------------------------------------------------------------
  app.get('/api/v1/claims', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    res.json(db.ownership_claims);
  });

  app.post('/api/v1/claims', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const { itemId, verificationAnswer, proofDescription, serialOrIdNumber } = req.body;
    const fieldErrors: Record<string, string> = {};

    if (!itemId) {
      fieldErrors.itemId = 'Target item report ID is required';
    }
    if (!verificationAnswer || verificationAnswer.trim().length < 5) {
      fieldErrors.verificationAnswer = 'Please provide a specific answer to the verification question (min 5 characters)';
    }
    if (!proofDescription || proofDescription.trim().length < 8) {
      fieldErrors.proofDescription = 'Supporting proof of ownership description is required (min 8 characters)';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'MethodArgumentNotValidException',
        fieldErrors,
      });
      return;
    }

    const db = loadDb();
    const item = db.item_reports.find((i) => i.id === itemId);
    if (!item) {
      res.status(404).json({ message: 'Target item report not found' });
      return;
    }

    const claimCode = `CLM-2026-${301 + db.ownership_claims.length}`;
    const newClaim: OwnershipClaimRecord = {
      id: `clm-${Date.now()}`,
      claimCode,
      itemId: item.id,
      itemReferenceCode: item.referenceCode,
      itemTitle: item.title,
      itemType: item.type,
      claimantUserId: req.user!.sub,
      claimantName: req.user!.fullName,
      claimantEmail: req.user!.email,
      claimantCampusId: req.user!.campusId,
      verificationAnswer: verificationAnswer.trim(),
      proofDescription: proofDescription.trim(),
      serialOrIdNumber: (serialOrIdNumber || 'Provided at Desk').trim(),
      status: 'PENDING_VERIFICATION',
      reviewedByOfficer: null,
      officerRemarks: null,
      pickupPassCode: null,
      collectionHubName: item.hubName || 'Security Desk 1',
      lockerBin: item.lockerBin || 'Bin S1-09',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      handedOverAt: null,
    };

    db.ownership_claims.unshift(newClaim);

    db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      recipientUserId: req.user!.sub,
      recipientRole: 'ALL',
      title: `Ownership Claim ${claimCode} Submitted for Verification`,
      message: `${req.user!.fullName} (${req.user!.campusId}) submitted ownership verification for "${item.title}" (${item.referenceCode}). Pending Campus Security review.`,
      category: 'VERIFICATION_UPDATE',
      relatedItemId: item.id,
      actionCode: claimCode,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    res.status(201).json(newClaim);
  });

  // Verify (Approve / Reject) an ownership claim and generate a Fixed Collection Pickup Pass
  app.patch('/api/v1/claims/:id/verify', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { decision, officerRemarks } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      res.status(400).json({ message: 'Decision must be APPROVED or REJECTED' });
      return;
    }

    const db = loadDb();
    const claim = db.ownership_claims.find((c) => c.id === id);
    if (!claim) {
      res.status(404).json({ message: 'Claim record not found' });
      return;
    }

    const item = db.item_reports.find((i) => i.id === claim.itemId);
    claim.status = decision;
    claim.reviewedByOfficer = req.user!.fullName;
    claim.officerRemarks =
      officerRemarks?.trim() ||
      (decision === 'APPROVED'
        ? 'Ownership answers and Campus ID verified. Cleared for fixed collection desk pickup.'
        : 'Verification details did not match custody item identifiers.');
    claim.verifiedAt = new Date().toISOString();

    if (decision === 'APPROVED') {
      const binSuffix = (claim.lockerBin || 'B01').replace(/[^A-Z0-9]/gi, '');
      claim.pickupPassCode = `PKP-${Math.floor(1000 + Math.random() * 9000)}-${binSuffix}`;
      if (item) {
        item.custodyStatus = 'CLAIM_APPROVED';
      }

      db.notifications.unshift({
        id: `ntf-${Date.now()}`,
        recipientUserId: claim.claimantUserId,
        recipientRole: 'ALL',
        title: `Ownership Approved — Pickup Pass ${claim.pickupPassCode}`,
        message: `Claim ${claim.claimCode} for "${claim.itemTitle}" was approved by ${req.user!.fullName}. Collect your item at ${claim.collectionHubName} (${claim.lockerBin}) with Pass ${claim.pickupPassCode}.`,
        category: 'PICKUP_READY',
        relatedItemId: claim.itemId,
        actionCode: claim.pickupPassCode,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      db.notifications.unshift({
        id: `ntf-${Date.now()}`,
        recipientUserId: claim.claimantUserId,
        recipientRole: 'ALL',
        title: `Ownership Claim ${claim.claimCode} Update`,
        message: `Claim ${claim.claimCode} for "${claim.itemTitle}" could not be verified: ${claim.officerRemarks}`,
        category: 'VERIFICATION_UPDATE',
        relatedItemId: claim.itemId,
        actionCode: claim.claimCode,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);
    res.json(claim);
  });

  // Record final physical handover at the Fixed Collection Hub
  app.patch('/api/v1/claims/:id/handover', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const claim = db.ownership_claims.find((c) => c.id === id);
    if (!claim) {
      res.status(404).json({ message: 'Claim record not found' });
      return;
    }

    claim.status = 'HANDED_OVER';
    claim.handedOverAt = new Date().toISOString();

    const item = db.item_reports.find((i) => i.id === claim.itemId);
    if (item) {
      item.custodyStatus = 'RETURNED';
      const hub = db.collection_hubs.find((h) => h.id === item.hubId);
      if (hub && hub.occupiedBins > 0) {
        hub.occupiedBins -= 1;
      }
    }

    db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      recipientUserId: claim.claimantUserId,
      recipientRole: 'ALL',
      title: `Fixed Collection Handover Completed (${claim.itemReferenceCode})`,
      message: `"${claim.itemTitle}" has been signed out and collected by ${claim.claimantName} (${claim.claimantCampusId}) at ${claim.collectionHubName}.`,
      category: 'CUSTODY_INTAKE',
      relatedItemId: claim.itemId,
      actionCode: claim.pickupPassCode,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    res.json(claim);
  });

  // --------------------------------------------------------------------------
  // 5. FIXED COLLECTION HUBS (/api/v1/hubs)
  // --------------------------------------------------------------------------
  app.get('/api/v1/hubs', authenticateJwt, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const enrichedHubs = db.collection_hubs.map((hub) => {
      const custodyItems = db.item_reports.filter(
        (item) => item.hubId === hub.id && (item.custodyStatus === 'IN_CUSTODY' || item.custodyStatus === 'CLAIM_APPROVED')
      );
      return {
        ...hub,
        custodyItems,
      };
    });
    res.json(enrichedHubs);
  });

  // --------------------------------------------------------------------------
  // 6. NOTIFICATIONS (/api/v1/notifications)
  // --------------------------------------------------------------------------
  app.get('/api/v1/notifications', authenticateJwt, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    res.json(db.notifications);
  });

  app.patch('/api/v1/notifications/:id/read', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.isRead = true;
      saveDb(db);
    }
    res.json({ success: true });
  });

  app.post('/api/v1/notifications/read-all', authenticateJwt, (_req: AuthenticatedRequest, res: Response) => {
    const db = loadDb();
    db.notifications.forEach((n) => {
      n.isRead = true;
    });
    saveDb(db);
    res.json({ success: true });
  });

  // --------------------------------------------------------------------------
  // 7. SPRING BOOT + MAVEN + MYSQL SOURCE CODE INSPECTOR ENDPOINT
  // --------------------------------------------------------------------------
  app.get('/api/v1/springboot/files', (_req: Request, res: Response) => {
    const filesToExpose = [
      {
        title: 'pom.xml',
        path: 'spring-boot-backend/pom.xml',
        language: 'xml',
        description: 'Maven configuration with Spring Boot 3.3, Spring Security, Bean Validation, JPA, JJWT, and MySQL Connector.',
      },
      {
        title: 'schema.sql',
        path: 'spring-boot-backend/src/main/resources/schema.sql',
        language: 'sql',
        description: 'MySQL 8.0 relational database schema for users, collection_hubs, item_reports, ownership_claims, and notifications.',
      },
      {
        title: 'application.properties',
        path: 'spring-boot-backend/src/main/resources/application.properties',
        language: 'properties',
        description: 'MySQL JDBC datasource connection, Hibernate dialect, and Stateless JWT secret key settings.',
      },
      {
        title: 'SecurityConfig.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/security/SecurityConfig.java',
        language: 'java',
        description: 'Spring Security 6 filter chain enforcing JWT authentication and role-based access (OWNER, FINDER, ADMIN_SECURITY).',
      },
      {
        title: 'JwtAuthenticationFilter.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/security/JwtAuthenticationFilter.java',
        language: 'java',
        description: 'Stateless OncePerRequestFilter extracting and validating Bearer JWT tokens.',
      },
      {
        title: 'JwtTokenProvider.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/security/JwtTokenProvider.java',
        language: 'java',
        description: 'JJWT 0.12.5 HMAC-SHA256 token generator and parser for CampusUserPrincipal.',
      },
      {
        title: 'CampusUserPrincipal.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/security/CampusUserPrincipal.java',
        language: 'java',
        description: 'Spring Security UserDetails implementation storing campus identity and role authorities.',
      },
      {
        title: 'ItemReportRequest.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/dto/ItemReportRequest.java',
        language: 'java',
        description: 'Jakarta Bean Validation DTO (@NotBlank, @Size, @Pattern, @NotNull) for reporting lost and found items.',
      },
      {
        title: 'ItemReportController.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/controller/ItemReportController.java',
        language: 'java',
        description: 'Spring Web @RestController exposing /api/v1/items search filters, report creation, and fixed hub custody intake.',
      },
      {
        title: 'ItemReportService.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/service/ItemReportService.java',
        language: 'java',
        description: 'Transactional service managing item report persistence, filtering, and fixed collection hub bin assignment.',
      },
      {
        title: 'AuthController.java',
        path: 'spring-boot-backend/src/main/java/edu/campus/lostfound/controller/AuthController.java',
        language: 'java',
        description: 'Authentication controller supporting login, registration, role switching, and current user session.',
      },
    ];

    const loaded = filesToExpose.map((file) => {
      const fullPath = path.resolve(process.cwd(), file.path);
      const content = fs.existsSync(fullPath)
        ? fs.readFileSync(fullPath, 'utf8')
        : '// File not found';
      return { ...file, content };
    });

    res.json(loaded);
  });

}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Veritas Campus Lost & Found server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
