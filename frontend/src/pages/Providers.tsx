import { UserRound } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function Providers() {
  return (
    <PagePlaceholder
      title="Providers"
      description="Manage healthcare provider records — licenses, DEA registrations, and per-provider credentialing history."
      icon={UserRound}
      module={2}
    />
  );
}
