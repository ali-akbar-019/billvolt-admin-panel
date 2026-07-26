import { Bell } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function FollowUps() {
  return (
    <PagePlaceholder
      title="Follow-ups"
      description="Tasks and reminders tied to credentialing — due today, upcoming, and overdue."
      icon={Bell}
      module={3}
    />
  );
}
