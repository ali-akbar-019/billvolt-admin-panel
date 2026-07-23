interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div>
      <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>{title}</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>{description}</p>
      <div
        style={{
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-card)',
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        This module is next on the roadmap.
      </div>
    </div>
  );
}
