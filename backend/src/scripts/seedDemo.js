// Seeds a full set of realistic demo data so you can explore every feature:
//   - 5 medical practices (with service locations, taxonomy, contacts)
//   - 16 providers (licenses, DEA, CAQH, encrypted SSN) across 6 specialties
//   - 73 credentialing records spanning all six statuses and 9 payer plans
//     with backdated dates that power the dashboard trend chart + top payers
//   - Follow-ups spread across overdue / due today / upcoming buckets
//   - Timeline activity log and audit-log entries for sensitive access
//   - Staff users and org settings
//
// Run it:
//   npm run seed:demo              # aborts if data already exists
//   npm run seed:demo -- --reset   # wipes demo collections first
//
// Requires MONGODB_URI and FIELD_ENCRYPTION_KEY (SSNs / CAQH creds are
// encrypted at rest, exactly like real saves).

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User.model');
const Practice = require('../models/Practice.model');
const Provider = require('../models/Provider.model');
const CredentialingRecord = require('../models/CredentialingRecord.model');
const FollowUp = require('../models/FollowUp.model');
const TimelineEntry = require('../models/TimelineEntry.model');
const AuditLog = require('../models/AuditLog.model');
const OrgSettings = require('../models/OrgSettings.model');

const DEMO_COLLECTIONS = [
  'practices',
  'providers',
  'credentialingrecords',
  'followups',
  'timelineentries',
  'auditlogs',
  'orgsettings',
];

// --- date helpers -----------------------------------------------------------
const now = new Date();
const daysFromNow = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
};
const monthsAgo = (n, day = 8) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  d.setHours(11, 0, 0, 0);
  return d;
};
const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
// Spreads an entry's createdAt across the record's life, never in the future.
const spreadEntryDates = (start, index, total) => {
  const spanDays = Math.min(Math.floor((Date.now() - start.getTime()) / 86400000), 45);
  const offsetDays = Math.floor((index / Math.max(total, 1)) * Math.max(spanDays, 1));
  const d = new Date(start);
  d.setDate(d.getDate() + offsetDays);
  return d > now ? now : d;
};

// --- static demo data -------------------------------------------------------
const STAFF = [
  { name: 'Sarah Mitchell', email: 'sarah.mitchell@billvolt.com', title: 'Credentialing Coordinator' },
  { name: 'James Carter', email: 'james.carter@billvolt.com', title: 'Credentialing Specialist' },
  { name: 'Priya Patel', email: 'priya.patel@billvolt.com', title: 'Compliance & PTAN Specialist' },
];
const STAFF_PASSWORD = 'Staff@12345';

const PAYER_CITATIONS = [
  { name: 'Sarah Jennings', phone: '(800) 555-0101' },
  { name: 'Dennis Fowler', phone: '(800) 555-0110' },
  { name: 'Angela Reyes', phone: '(888) 555-0132' },
  { name: 'Tom Okafor', phone: '(800) 555-0178' },
  { name: 'Linda Marsh', phone: '(866) 555-0145' },
];

const PRACTICES = [
  {
    groupName: 'Riverside Family Medicine',
    dbaName: 'Riverside Family Medicine',
    groupNpi: '1346697104',
    taxId: '32-1487596',
    orgType: 'Group Practice',
    taxonomy: '207Q00000X',
    cliaNumber: '45D0987651',
    medicarePtan: 'TXF32211',
    medicaidProviderNumber: '214598',
    contact: { phone: '(469) 555-0124', fax: '(469) 555-0134', email: 'billing@riversidefamilytx.com', website: 'riversidefamilytx.com' },
    serviceLocations: [
      { label: 'Main office', street: '2100 Preston Rd', city: 'Dallas', state: 'TX', zip: '75230', isPrimary: true },
      { label: 'Satellite — Plano', street: '5800 Legacy Dr', city: 'Plano', state: 'TX', zip: '75024' },
      { label: 'Satellite — Frisco', street: '9201 Warren Pkwy', city: 'Frisco', state: 'TX', zip: '75036' },
    ],
    mailingAddress: { street: 'PO Box 912340', city: 'Dallas', state: 'TX', zip: '75391' },
    billingAddress: { street: '2100 Preston Rd', city: 'Dallas', state: 'TX', zip: '75230' },
    owner: { name: 'Dr. Margaret Hayes', phone: '(469) 555-0150', email: 'mhayes@riversidefamilytx.com' },
    status: 'active',
  },
  {
    groupName: 'Crescent Women\u2019s Health',
    dbaName: 'Crescent Women\u2019s Health',
    groupNpi: '1457839405',
    taxId: '59-2270841',
    orgType: 'Group Practice',
    taxonomy: '207V00000X',
    cliaNumber: '10D1092234',
    medicarePtan: 'FLP72850',
    medicaidProviderNumber: '728903',
    contact: { phone: '(407) 555-0188', fax: '(407) 555-0189', email: 'admin@crescentwomenshealth.com', website: 'crescentwomenshealth.com' },
    serviceLocations: [
      { label: 'Main office', street: '7400 Lake Nona Blvd', city: 'Orlando', state: 'FL', zip: '32827', isPrimary: true },
      { label: 'Satellite — Winter Park', street: '2300 Aloma Ave', city: 'Winter Park', state: 'FL', zip: '32792' },
    ],
    mailingAddress: { street: '7400 Lake Nona Blvd', city: 'Orlando', state: 'FL', zip: '32827' },
    billingAddress: { street: 'PO Box 4109', city: 'Orlando', state: 'FL', zip: '32802' },
    owner: { name: 'Dr. Jessica Moreno', phone: '(407) 555-0162', email: 'jmoreno@crescentwomenshealth.com' },
    status: 'active',
  },
  {
    groupName: 'Lakeside Cardiovascular Associates',
    dbaName: 'Lakeside Cardiology',
    groupNpi: '1861648932',
    taxId: '36-4491208',
    orgType: 'Group Practice',
    taxonomy: '207RC0000X',
    cliaNumber: '14D2044877',
    medicarePtan: 'ILP91645',
    medicaidProviderNumber: 'M0387332',
    contact: { phone: '(312) 555-0199', fax: '(312) 555-0145', email: 'frontdesk@lakesidecardio.com', website: 'lakesidecardio.com' },
    serviceLocations: [
      { label: 'Loop office', street: '233 S Wacker Dr', city: 'Chicago', state: 'IL', zip: '60606', isPrimary: true },
      { label: 'Satellite — Evanston', street: '1600 Sherman Ave', city: 'Evanston', state: 'IL', zip: '60201' },
      { label: 'Satellite — Naperville', street: '1210 Riverwalk Dr', city: 'Naperville', state: 'IL', zip: '60540' },
    ],
    mailingAddress: { street: 'PO Box 8801', city: 'Chicago', state: 'IL', zip: '60680' },
    billingAddress: { street: '233 S Wacker Dr', city: 'Chicago', state: 'IL', zip: '60606' },
    owner: { name: 'Dr. David Whitfield', phone: '(312) 555-0133', email: 'dwhitfield@lakesidecardio.com' },
    status: 'active',
  },
  {
    groupName: 'Peak Orthopedic Clinic',
    dbaName: 'Peak Orthopedic Clinic',
    groupNpi: '1235594027',
    taxId: '84-3815260',
    orgType: 'Group Practice',
    taxonomy: '207X00000X',
    cliaNumber: '06D1029788',
    medicarePtan: 'COP55518',
    medicaidProviderNumber: '4018223',
    contact: { phone: '(303) 555-0166', fax: '(303) 555-0167', email: 'office@peakortho.co', website: 'peakortho.co' },
    serviceLocations: [
      { label: 'Main office', street: '2200 Broadway St', city: 'Denver', state: 'CO', zip: '80203', isPrimary: true },
      { label: 'Satellite — Boulder', street: '1101 Pearl St', city: 'Boulder', state: 'CO', zip: '80302' },
    ],
    mailingAddress: { street: 'PO Box 7720', city: 'Denver', state: 'CO', zip: '80207' },
    billingAddress: { street: '2200 Broadway St', city: 'Denver', state: 'CO', zip: '80203' },
    owner: { name: 'Dr. Nathan Brooks', phone: '(303) 555-0177', email: 'nbrooks@peakortho.co' },
    status: 'active',
  },
  {
    groupName: 'Northstar Behavioral Health',
    dbaName: 'Northstar Behavioral Health',
    groupNpi: '1740695512',
    taxId: '91-2268174',
    orgType: 'Group Practice',
    taxonomy: '2084P0800X',
    cliaNumber: null,
    medicarePtan: 'WAP44807',
    medicaidProviderNumber: 'S-448012',
    contact: { phone: '(206) 555-0111', fax: '(206) 555-0112', email: 'billing@northstarbh.com', website: 'northstarbh.com' },
    serviceLocations: [
      { label: 'Capitol Hill office', street: '1400 Broadway Ave E', city: 'Seattle', state: 'WA', zip: '98122', isPrimary: true },
      { label: 'Satellite — Bellevue', street: '555 108th Ave NE', city: 'Bellevue', state: 'WA', zip: '98004' },
    ],
    mailingAddress: { street: 'PO Box 33114', city: 'Seattle', state: 'WA', zip: '98133' },
    billingAddress: { street: '1400 Broadway Ave E', city: 'Seattle', state: 'WA', zip: '98122' },
    owner: { name: 'Dr. Rachel Kim', phone: '(206) 555-0180', email: 'rkim@northstarbh.com' },
    status: 'active',
  },
];

// Credentialing spec: [payerName, status, { createdMonthsAgo, createdDay, submittedDaysAgo,
// approvedDaysAgo, expirationInDays, followUpInDays, reason }]
const PROVIDER_DEFS = [
  { practice: 0, name: 'Dr. Margaret Hayes', providerType: 'MD', npi: '1992784650', specialty: 'Family Medicine', gender: 'Female', dob: '1972-06-14',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 4, approvedDaysAgo: 70, expirationInDays: 290 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 3, approvedDaysAgo: 45, expirationInDays: 315 }],
      ['Medicare', 'approved', { createdMonthsAgo: 0, createdDay: 2, approvedDaysAgo: 3, expirationInDays: 320 }],
      ['Medicaid', 'in_progress', { createdMonthsAgo: 1, submittedDaysAgo: 22, followUpInDays: 6 }],
      ['Cigna', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 15, followUpInDays: 3 }],
      ['Tricare', 'not_started', { createdMonthsAgo: 0, followUpInDays: 10 }],
    ] },
  { practice: 0, name: 'Dr. Luis Romero', providerType: 'MD', npi: '1629284570', specialty: 'Family Medicine', gender: 'Male', dob: '1980-01-22',
    credentialing: [
      ['Aetna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 1 }],
      ['United Healthcare', 'approved', { createdMonthsAgo: 2, approvedDaysAgo: 30, expirationInDays: 330 }],
      ['Humana', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 10, followUpInDays: 2 }],
      ['Medicaid', 'not_started', { createdMonthsAgo: 0, followUpInDays: 14 }],
      ['Medicare', 'in_progress', { createdMonthsAgo: 1, submittedDaysAgo: 20, followUpInDays: -2 }],
    ] },
  { practice: 0, name: 'Melissa Tran', providerType: 'NP', npi: '1841370924', specialty: 'Family Medicine', gender: 'Female', dob: '1987-11-03',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 2, approvedDaysAgo: 25, expirationInDays: 340 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 1, createdDay: 6, approvedDaysAgo: 12, expirationInDays: 350 }],
      ['Cigna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 4 }],
      ['Medicare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 8, followUpInDays: 5 }],
    ] },
  { practice: 0, name: 'Dr. Robert Chen', providerType: 'DO', npi: '1386742103', specialty: 'Pediatrics', gender: 'Male', dob: '1978-09-30',
    credentialing: [
      ['Aetna', 'expired', { createdMonthsAgo: 8, createdDay: 10, approvedDaysAgo: 160, expirationInDays: -40 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 3, createdDay: 12, approvedDaysAgo: 55, expirationInDays: 300 }],
      ['Cigna', 'not_started', { createdMonthsAgo: 0, followUpInDays: 0 }],
      ['Medicaid', 'in_progress', { createdMonthsAgo: 1, submittedDaysAgo: 18, followUpInDays: 0 }],
      ['United Healthcare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 6, followUpInDays: 2 }],
      ['Oscar Health', 'denied', { createdMonthsAgo: 2, reason: 'Denied — missing residency verification letter on file.' }],
    ] },
  { practice: 1, name: 'Dr. Jessica Moreno', providerType: 'MD', npi: '1861409627', specialty: 'Obstetrics & Gynecology', gender: 'Female', dob: '1975-03-08',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 5, createdDay: 9, approvedDaysAgo: 90, expirationInDays: 280 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 0, createdDay: 3, approvedDaysAgo: 5, expirationInDays: 315 }],
      ['United Healthcare', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 6 }],
      ['Cigna', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 12, followUpInDays: 3 }],
      ['Humana', 'not_started', { createdMonthsAgo: 0, followUpInDays: 8 }],
    ] },
  { practice: 1, name: 'Dr. Amina Hassan', providerType: 'MD', npi: '1942321068', specialty: 'Obstetrics & Gynecology', gender: 'Female', dob: '1984-07-19',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 4, approvedDaysAgo: 60, expirationInDays: 300 }],
      ['Medicare', 'approved', { createdMonthsAgo: 0, createdDay: 2, approvedDaysAgo: 7, expirationInDays: 310 }],
      ['Medicaid', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 9, followUpInDays: 2 }],
      ['Cigna', 'in_progress', { createdMonthsAgo: 1, submittedDaysAgo: 25, followUpInDays: -1 }],
      ['Tricare', 'not_started', { createdMonthsAgo: 0, followUpInDays: 12 }],
    ] },
  { practice: 1, name: 'Kelsey Ortiz', providerType: 'CNM', npi: '1104982356', specialty: 'Midwifery', gender: 'Female', dob: '1990-04-27',
    credentialing: [
      ['Aetna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: -3 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 2, approvedDaysAgo: 20, expirationInDays: 340 }],
      ['United Healthcare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 7, followUpInDays: 4 }],
      ['Humana', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 5, followUpInDays: 1 }],
    ] },
  { practice: 2, name: 'Dr. David Whitfield', providerType: 'MD', npi: '1588601742', specialty: 'Interventional Cardiology', gender: 'Male', dob: '1969-12-05',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 5, createdDay: 7, approvedDaysAgo: 88, expirationInDays: 280 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 3, approvedDaysAgo: 40, expirationInDays: 320 }],
      ['United Healthcare', 'approved', { createdMonthsAgo: 2, approvedDaysAgo: 33, expirationInDays: 327 }],
      ['Medicare', 'approved', { createdMonthsAgo: 0, createdDay: 2, approvedDaysAgo: 2, expirationInDays: 330 }],
      ['Cigna', 'not_started', { createdMonthsAgo: 0, followUpInDays: 7 }],
    ] },
  { practice: 2, name: 'Dr. Elena Sorokin', providerType: 'MD', npi: '1720258391', specialty: 'Cardiology (Electrophysiology)', gender: 'Female', dob: '1982-08-16',
    credentialing: [
      ['Aetna', 'submitted', { createdMonthsAgo: 1, submittedDaysAgo: 22, followUpInDays: 0 }],
      ['Cigna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 5 }],
      ['Humana', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 8, followUpInDays: 3 }],
      ['Medicare', 'approved', { createdMonthsAgo: 1, createdDay: 5, approvedDaysAgo: 18, expirationInDays: 342 }],
    ] },
  { practice: 2, name: 'Dr. Marcus Bell', providerType: 'MD', npi: '1912278430', specialty: 'Cardiology', gender: 'Male', dob: '1970-05-11',
    credentialing: [
      ['Aetna', 'denied', { createdMonthsAgo: 3, reason: 'Denied — incomplete affiliation paperwork with the group.' }],
      ['Blue Cross Blue Shield', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 6 }],
      ['United Healthcare', 'not_started', { createdMonthsAgo: 0, followUpInDays: 15 }],
      ['Medicaid', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 4, followUpInDays: 1 }],
      ['Medicare', 'expired', { createdMonthsAgo: 9, createdDay: 14, approvedDaysAgo: 200, expirationInDays: -15 }],
    ] },
  { practice: 3, name: 'Dr. Nathan Brooks', providerType: 'MD', npi: '1477810039', specialty: 'Orthopedic Surgery', gender: 'Male', dob: '1974-02-28',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 5, createdDay: 6, approvedDaysAgo: 95, expirationInDays: 270 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 2, approvedDaysAgo: 35, expirationInDays: 325 }],
      ['United Healthcare', 'approved', { createdMonthsAgo: 0, createdDay: 2, approvedDaysAgo: 4, expirationInDays: 330 }],
      ['Cigna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 4 }],
      ['Medicare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 9, followUpInDays: 6 }],
    ] },
  { practice: 3, name: 'Dr. Yuki Tanaka', providerType: 'MD', npi: '1659702483', specialty: 'Orthopedic Surgery', gender: 'Female', dob: '1985-10-09',
    credentialing: [
      ['Aetna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: -5 }],
      ['Humana', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 6, followUpInDays: 3 }],
      ['Medicare', 'approved', { createdMonthsAgo: 1, createdDay: 4, approvedDaysAgo: 15, expirationInDays: 345 }],
      ['Tricare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 11, followUpInDays: 2 }],
    ] },
  { practice: 3, name: 'Andrea Foster', providerType: 'PA', npi: '1255037841', specialty: 'Orthopedic Surgery', gender: 'Female', dob: '1991-06-25', inactive: true,
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 3, approvedDaysAgo: 50, expirationInDays: 310 }],
      ['Cigna', 'not_started', { createdMonthsAgo: 0, followUpInDays: 9 }],
      ['United Healthcare', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 7 }],
    ] },
  { practice: 4, name: 'Dr. Rachel Kim', providerType: 'MD', npi: '1831295704', specialty: 'Psychiatry', gender: 'Female', dob: '1979-09-17',
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 1, createdDay: 3, approvedDaysAgo: 16, expirationInDays: 344 }],
      ['Blue Cross Blue Shield', 'approved', { createdMonthsAgo: 0, createdDay: 2, approvedDaysAgo: 6, expirationInDays: 320 }],
      ['Cigna', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 5 }],
      ['Medicaid', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 13, followUpInDays: 2 }],
      ['United Healthcare', 'approved', { createdMonthsAgo: 4, createdDay: 11, approvedDaysAgo: 65, expirationInDays: 295 }],
    ] },
  { practice: 4, name: 'Dr. Omar Farouk', providerType: 'MD', npi: '1548319207', specialty: 'Child & Adolescent Psychiatry', gender: 'Male', dob: '1983-01-12',
    credentialing: [
      ['Aetna', 'denied', { createdMonthsAgo: 2, reason: 'Denied — provider not contracted with the group at the time of review.' }],
      ['Humana', 'not_started', { createdMonthsAgo: 0, followUpInDays: 11 }],
      ['Medicaid', 'in_progress', { createdMonthsAgo: 1, submittedDaysAgo: 24, followUpInDays: -4 }],
      ['Tricare', 'submitted', { createdMonthsAgo: 0, submittedDaysAgo: 5, followUpInDays: 0 }],
    ] },
  { practice: 4, name: 'Thomas Bailey', providerType: 'LICSW', npi: '1025164876', specialty: 'Behavioral Health', gender: 'Male', dob: '1988-03-21', inactive: true,
    credentialing: [
      ['Aetna', 'approved', { createdMonthsAgo: 3, approvedDaysAgo: 42, expirationInDays: 318 }],
      ['Blue Cross Blue Shield', 'not_started', { createdMonthsAgo: 0, followUpInDays: 13 }],
      ['Medicare', 'in_progress', { createdMonthsAgo: 0, followUpInDays: 8 }],
    ] },
];

// --- timeline templates -----------------------------------------------------
const TIMELINE_TEMPLATES = {
  not_started: [
    { type: 'note', lines: ['Kickoff: collected completed enrollment packet and provider demographics.'] },
  ],
  in_progress: [
    { type: 'status_change', lines: ['Opened application — initial credentialing intake completed.'] },
    { type: 'call', lines: ['Called payer provider relations; application is in the review queue.'] },
  ],
  submitted: [
    { type: 'submission', ref: true, lines: ['Credentialing application submitted via payer portal.', 'Application and supporting documents submitted.'] },
    { type: 'call', lines: ['Confirmed receipt of submission and requested reference number.'] },
    { type: 'email', lines: ['Sent follow-up email asking for a status update.'] },
  ],
  approved: [
    { type: 'submission', ref: true, lines: ['Initial enrollment packet submitted to payer.'] },
    { type: 'portal_update', ref: true, lines: ['Attestation and license PDFs uploaded to the payer portal.'] },
    { type: 'status_change', ref: true, lines: ['Application cleared review; credentialing approved.'] },
    { type: 'approval', ref: true, lines: ['Approval letter received. Effective date noted.', 'Approval confirmation completed over the phone.'] },
  ],
  denied: [
    { type: 'submission', ref: true, lines: ['Enrollment packet submitted to payer.'] },
    { type: 'note', lines: ['Denial notice received; documented reason in the record.'] },
    { type: 'status_change', lines: ['Application denied; flagged for appeal/re-submission.'] },
  ],
  expired: [
    { type: 'approval', ref: true, lines: ['Originally approved for a 1-year credentialing period.'] },
    { type: 'note', lines: ['Credentialing period expired; renewal packet requested.'] },
    { type: 'status_change', lines: ['Marked expired — renewal application now in progress.'] },
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- main -------------------------------------------------------------------
const resetDemoData = async () => {
  await Promise.all(DEMO_COLLECTIONS.map((c) => mongoose.connection.collection(c).deleteMany({})));
  console.log('[seed] Cleared existing demo collections.');
};

const ensureUsers = async () => {
  let admin = await User.findOne({ email: 'admin@billvolt.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@billvolt.com',
      passwordHash: await User.hashPassword('Admin@12345'),
      role: 'admin',
      status: 'active',
    });
    console.log('[seed] Admin account created: admin@billvolt.com / Admin@12345');
  }

  const staff = [];
  for (const s of STAFF) {
    const existing = await User.findOne({ email: s.email });
    if (existing) {
      staff.push(existing);
      continue;
    }
    const u = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: await User.hashPassword(STAFF_PASSWORD),
      role: 'staff',
      status: 'active',
    });
    staff.push(u);
  }
  return { admin, staff };
};

const run = async () => {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.error('FIELD_ENCRYPTION_KEY is required (provider SSN / CAQH fields are encrypted).');
    process.exit(1);
  }

  const wantsReset = process.argv.includes('--reset');
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB connection failed. Set MONGODB_URI in backend/.env and try again.');
    process.exit(1);
  }

  if (!wantsReset) {
    const practiceCount = await Practice.countDocuments();
    if (practiceCount > 0) {
      console.error('Demo data already exists. Re-run with `npm run seed:demo -- --reset` to wipe and reseed.');
      process.exit(1);
    }
  } else {
    await resetDemoData();
  }

  const { admin, staff } = await ensureUsers();
  const specialistCycle = [...staff];
  const assignedCycle = [...staff];

  // Org settings
  await OrgSettings.findOneAndUpdate(
    {},
    { orgName: 'BillVolt', timezone: 'America/New_York', contactEmail: 'ops@billvolt.com', sessionTimeoutMinutes: 30, notifyOnOverdueFollowUps: true, updatedBy: staff[0]._id },
    { upsert: true, new: true }
  );

  // Practices
  const practiceDocs = await Practice.create(PRACTICES);
  console.log(`[seed] ${practiceDocs.length} practices created.`);

  // FR-001: distribute the practices across the demo staff so each user only
  // sees a subset (Sarah: 0-1, James: 2-3, Priya: 4). Existing users keep any
  // assignments they already have.
  await Promise.all(
    staff.map((user, i) => {
      const assigned = practiceDocs
        .filter((_, p) => p % staff.length === i)
        .map((p) => p._id);
      if (assigned.length === 0) return Promise.resolve();
      return User.findByIdAndUpdate(user._id, { $addToSet: { assignedPracticeIds: { $each: assigned } } });
    })
  );
  console.log('[seed] Demo staff practice assignments applied.');

  // Providers
  const providerDocs = [];
  for (const def of PROVIDER_DEFS) {
    const practice = practiceDocs[def.practice];
    const state = practice.serviceLocations.find((l) => l.isPrimary)?.state || 'TX';
    const specialist = pick(specialistCycle);

    const provider = await Provider.create({
      name: def.name,
      providerType: def.providerType,
      npi: def.npi,
      specialty: def.specialty,
      secondarySpecialty: def.secondarySpecialty || undefined,
      dob: new Date(def.dob),
      gender: def.gender,
      ssn: `${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`,
      practiceId: practice._id,
      contact: {
        phone: `(${Math.floor(200 + Math.random() * 799)}) 555-0${Math.floor(100 + Math.random() * 899)}`,
        email: `${def.name.toLowerCase().replace(/^dr\.\s*/, '').replace(/[^a-z]+/g, '.')}@${practice.dbaName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      },
      homeAddress: { street: practice.serviceLocations[0].street, city: practice.serviceLocations[0].city, state: practice.serviceLocations[0].state, zip: practice.serviceLocations[0].zip },
      licenses: [
        {
          type: 'Medical License',
          number: `L-${state}${String(Math.floor(100000 + Math.random() * 899999))}`,
          state,
          issueDate: monthsAgo(36 + Math.floor(Math.random() * 12)),
          expirationDate: addDays(monthsAgo(36 + Math.floor(Math.random() * 12)), 365 * 3),
          status: 'active',
        },
      ],
      deaRegistrations: [
        {
          number: `${'ABCDEFGHIJKLMNP'[Math.floor(Math.random() * 14)]}${'ABCDEFGHIJKLMNP'[Math.floor(Math.random() * 14)]}${Math.floor(1000000 + Math.random() * 8999999)}`,
          state,
          issueDate: monthsAgo(18),
          expirationDate: addDays(monthsAgo(18), 365 * 3),
          status: 'active',
        },
      ],
      caqh: (() => {
        const kind = pick(['current', 'current', 'current', 'due_soon', 'overdue', 'not_linked']);
        if (kind === 'not_linked') {
          return { status: 'not_linked' };
        }
        const lastAttestedDate = daysFromNow(kind === 'overdue' ? -120 : -(20 + Math.floor(Math.random() * 60)));
        const nextAttestationDue = kind === 'overdue' ? daysFromNow(-10) : kind === 'due_soon' ? daysFromNow(25) : daysFromNow(90 + Math.floor(Math.random() * 90));
        return {
          caqhId: `CAQH-${Math.floor(10000000 + Math.random() * 89999999)}`,
          username: def.name.toLowerCase().replace(/[^a-z]/g, ''),
          password: `demo-${Math.floor(1000 + Math.random() * 8999)}`,
          lastAttestedDate,
          nextAttestationDue,
          status: kind,
        };
      })(),
      assignedSpecialist: specialist._id,
      status: def.inactive ? 'inactive' : 'active',
    });

    providerDocs.push({ provider, def });
  }
  console.log(`[seed] ${providerDocs.length} providers created.`);

  // Credentialing records (+ synced follow-ups)
  const recordDocs = [];
  const createdFollowUps = [];
  const recordsNeedingTimeline = [];

  for (const { provider, def } of providerDocs) {
    for (const [payerName, status, opts] of def.credentialing) {
      const assignedTo = pick(assignedCycle);
      const createdAt = monthsAgo(opts.createdMonthsAgo, opts.createdDay || (1 + Math.floor(Math.random() * 10)));
      const approvedDate = opts.approvedDaysAgo !== undefined ? daysFromNow(-opts.approvedDaysAgo) : undefined;

      const record = await CredentialingRecord.create({
        providerId: provider._id,
        payerName,
        status,
        assignedTo: assignedTo._id,
        notes: status === 'denied' ? opts.reason : undefined,
        submittedDate:
          opts.submittedDaysAgo !== undefined
            ? daysFromNow(-opts.submittedDaysAgo)
            : approvedDate
              ? addDays(approvedDate, -25)
              : undefined,
        approvedDate,
        expirationDate: ['approved', 'expired'].includes(status) && approvedDate ? daysFromNow(opts.expirationInDays) : undefined,
        nextFollowUpDate: opts.followUpInDays !== undefined ? daysFromNow(opts.followUpInDays) : undefined,
        createdAt,
      });

      // Mongoose only lets updateOne backdate updatedAt; createdAt is kept
      // because it was passed into create() above.
      const updatedAt =
        approvedDate && opts.createdMonthsAgo === 0
          ? daysFromNow(-opts.approvedDaysAgo)
          : createdAt;
      await CredentialingRecord.updateOne({ _id: record._id }, { $set: { updatedAt } }, { timestamps: false });

      recordDocs.push({ provider, record, status, createdAt });

      if (opts.followUpInDays !== undefined) {
        const followUp = await FollowUp.create({
          title: `Follow up: ${payerName} — ${provider.name}`,
          linkedType: 'CredentialingRecord',
          linkedId: record._id,
          dueDate: daysFromNow(opts.followUpInDays),
          assignedTo: assignedTo._id,
          priority: opts.followUpInDays < 0 ? 'high' : 'medium',
          status: 'pending',
        });
        createdFollowUps.push(followUp);
      }

      if (TIMELINE_TEMPLATES[status]) recordsNeedingTimeline.push({ record, status, createdAt });
    }
  }
  console.log(`[seed] ${recordDocs.length} credentialing records created.`);
  console.log(`[seed] ${createdFollowUps.length} follow-ups synced.`);

  // Manually linked (Provider-level) follow-ups
  const providerFollowUpTargets = [
    { provider: providerDocs.find((p) => p.provider.name === 'Dr. Rachel Kim').provider, title: 'Collect renewed DEA certificate for reappointment', dueIn: 2 },
    { provider: providerDocs.find((p) => p.provider.name === 'Dr. David Whitfield').provider, title: 'CAQH re-attestation window opens for upcoming cycle', dueIn: 5 },
  ];
  for (const t of providerFollowUpTargets) {
    await FollowUp.create({
      title: t.title,
      linkedType: 'Provider',
      linkedId: t.provider._id,
      dueDate: daysFromNow(t.dueIn),
      assignedTo: pick(assignedCycle)._id,
      priority: 'high',
      status: 'pending',
    });
  }

  // Timeline entries
  let timelineCount = 0;
  for (const { record, status, createdAt } of recordsNeedingTimeline) {
    const templates = TIMELINE_TEMPLATES[status];
    for (let i = 0; i < templates.length; i += 1) {
      const t = templates[i];
      const citation = pick(PAYER_CITATIONS);
      const entryDate = spreadEntryDates(createdAt, i, templates.length);
      const entry = await TimelineEntry.create({
        credentialingRecordId: record._id,
        activityType: t.type,
        notes: t.lines[i % t.lines.length],
        referenceNumber: t.ref ? `REF-${String(Math.floor(100000 + Math.random() * 899999))}` : undefined,
        contactPerson: ['call', 'email', 'fax'].includes(t.type) ? citation.name : undefined,
        userId: pick(assignedCycle)._id,
        createdAt: entryDate,
      });
      await TimelineEntry.updateOne({ _id: entry._id }, { $set: { updatedAt: entryDate } }, { timestamps: false });
      timelineCount += 1;
    }
  }
  console.log(`[seed] ${timelineCount} timeline entries created.`);

  // Audit log touchstones
  const sensitiveProvider = providerDocs[5].provider;
  const initiator = staff[1];
  await AuditLog.create([
    { userId: initiator._id, action: 'view_sensitive', resourceType: 'Provider', resourceId: sensitiveProvider._id, metadata: { fields: ['ssn', 'caqh'] }, ipAddress: '127.0.0.1' },
    { userId: staff[0]._id, action: 'update', resourceType: 'CredentialingRecord', resourceId: recordDocs[12].record._id, metadata: { changedFields: ['status'], statusFrom: 'submitted', statusTo: 'approved' }, ipAddress: '127.0.0.1' },
    { userId: staff[0]._id, action: 'create', resourceType: 'CredentialingRecord', resourceId: recordDocs[3].record._id, metadata: { payerName: 'Oscar Health' }, ipAddress: '127.0.0.1' },
    { userId: admin._id ?? initiator._id, action: 'delete', resourceType: 'FollowUp', resourceId: new mongoose.Types.ObjectId(), metadata: { title: 'Example manual cleanup' }, ipAddress: '127.0.0.1' },
  ]);

  // Summary
  const statusBreakdown = await CredentialingRecord.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  const [overdue, today, upcoming] = await Promise.all([
    FollowUp.countDocuments({ status: 'pending', dueDate: { $lt: todayStart } }),
    FollowUp.countDocuments({ status: 'pending', dueDate: { $gte: todayStart, $lte: todayEnd } }),
    FollowUp.countDocuments({ status: 'pending', dueDate: { $gt: todayEnd } }),
  ]);
  const followUpBuckets = [
    { _id: 'overdue', count: overdue },
    { _id: 'today', count: today },
    { _id: 'upcoming', count: upcoming },
  ];

  console.log('\n=== Seed complete — what you can explore ===');
  console.log(`Practices:            ${practiceDocs.length}`);
  console.log(`Providers:            ${providerDocs.length}`);
  console.log(`Credentialing records: ${recordDocs.length}`);
  console.log('By status:            ' + statusBreakdown.map((s) => `${s._id}:${s.count}`).join(', '));
  console.log('Pending follow-ups:   ' + followUpBuckets.map((b) => `${b._id}:${b.count}`).join(', '));
  console.log('\nLog in with');
  console.log(`  Admin: admin@billvolt.com / Admin@12345`);
  console.log(`  Staff: ${STAFF[0].email} / ${STAFF_PASSWORD} (and ${STAFF.slice(1).map((s) => s.email).join(', ')})`);
  console.log('\nTry: dashboard KPI cards + charts, credentialing grid inline edits, follow-up buckets,');
  console.log('practice/provider workspaces, reports, AI assistant questions, and admin user management.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});