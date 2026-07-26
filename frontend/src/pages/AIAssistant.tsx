import { Sparkles } from 'lucide-react';
import { PagePlaceholder } from '../components/PagePlaceholder';

export function AIAssistant() {
  return (
    <PagePlaceholder
      title="AI assistant"
      description="Ask questions about your portal data in plain English and get grounded, permission-safe answers."
      icon={Sparkles}
      module={3}
    />
  );
}
