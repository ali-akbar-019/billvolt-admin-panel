import { Settings } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Organization preferences, security policy, and system configuration."
      icon={Settings}
      module={4}
    />
  );
}
