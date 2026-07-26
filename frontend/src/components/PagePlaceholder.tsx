import type { ComponentType } from 'react';
import { Hammer } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  module?: number;
}

export function PagePlaceholder({ title, description, icon: Icon = Hammer, module }: PagePlaceholderProps) {
  return (
    <div>
      <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>{title}</h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 28px', maxWidth: 480 }}>
        {description}
      </p>

      <div className="empty-state">
        <div className="empty-state-icon">
          <Icon size={26} strokeWidth={1.75} />
        </div>
        <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
          Not built yet
        </p>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
          This screen is on the roadmap and isn't part of Module 1.
        </p>
        {module && <div className="empty-state-badge">Ships in Module {module}</div>}
      </div>
    </div>
  );
}
