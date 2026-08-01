import type { CredentialingStatus } from '../types';

export const STATUS_OPTIONS: { value: CredentialingStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'expired', label: 'Expired' },
];

export const STATUS_LABEL: Record<CredentialingStatus, string> = STATUS_OPTIONS.reduce(
  (acc, { value, label }) => ({ ...acc, [value]: label }),
  {} as Record<CredentialingStatus, string>
);

export const statusColors = (status: CredentialingStatus) => ({
  background: `var(--status-${status.replace(/_/g, '-')}-tint)`,
  color: `var(--status-${status.replace(/_/g, '-')})`,
});
