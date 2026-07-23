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
