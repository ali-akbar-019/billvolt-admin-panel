import { BarChart3 } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function Reports() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Analytics and exportable reports across practices, providers, and credentialing status."
      icon={BarChart3}
      module={3}
    />
  );
}
