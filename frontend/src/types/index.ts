export type UserRole = 'admin' | 'staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
}

export type CredentialingStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'denied'
  | 'expired';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ServiceLocation extends Address {
  _id?: string;
  label?: string;
  isPrimary?: boolean;
  active?: boolean;
}

export interface PracticeContact {
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
}

export interface PracticeOwner {
  name?: string;
  phone?: string;
  email?: string;
}

export interface CredentialingRecord {
  _id: string;
  providerId: { _id: string; name: string; npi?: string; practiceId?: { _id: string; groupName: string } } | string;
  payerName: string;
  status: CredentialingStatus;
  submittedDate?: string;
  approvedDate?: string;
  expirationDate?: string;
  assignedTo?: { _id: string; name: string; email: string } | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  _id?: string;
  type?: string;
  number?: string;
  state?: string;
  issueDate?: string;
  expirationDate?: string;
  status?: 'active' | 'expired' | 'pending';
}

export interface DeaRegistration {
  _id?: string;
  number?: string;
  state?: string;
  issueDate?: string;
  expirationDate?: string;
  status?: 'active' | 'expired' | 'pending';
}

export interface Provider {
  _id: string;
  name: string;
  providerType?: string;
  npi?: string;
  specialty?: string;
  secondarySpecialty?: string;
  taxonomy?: string;
  dob?: string;
  gender?: string;
  practiceId: { _id: string; groupName: string; status?: string } | string;
  contact?: { phone?: string; email?: string };
  homeAddress?: Address;
  licenses?: License[];
  deaRegistrations?: DeaRegistration[];
  caqh?: {
    caqhId?: string;
    lastAttestedDate?: string;
    nextAttestationDue?: string;
    status?: 'current' | 'due_soon' | 'overdue' | 'not_linked';
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Practice {
  _id: string;
  groupName: string;
  dbaName?: string;
  groupNpi?: string;
  taxId?: string;
  orgType?: string;
  taxonomy?: string;
  cliaNumber?: string;
  medicarePtan?: string;
  medicaidProviderNumber?: string;
  contact?: PracticeContact;
  serviceLocations?: ServiceLocation[];
  mailingAddress?: Address;
  billingAddress?: Address;
  owner?: PracticeOwner;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
