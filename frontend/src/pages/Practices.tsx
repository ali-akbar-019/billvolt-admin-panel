import { Building2 } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function Practices() {
  return (
    <PagePlaceholder
      title="Practices"
      description="Manage medical practices and clinics — profiles, service locations, and payer credentialing grids."
      icon={Building2}
      module={2}
    />
  );
}
