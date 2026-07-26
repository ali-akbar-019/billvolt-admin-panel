import { ClipboardCheck } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function CredentialingGrid() {
  return (
    <PagePlaceholder
      title="Credentialing grid"
      description="Track provider-by-payer credentialing status, effective dates, and activity timelines."
      icon={ClipboardCheck}
      module={2}
    />
  );
}
