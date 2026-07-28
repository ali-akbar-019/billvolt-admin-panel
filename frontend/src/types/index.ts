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
