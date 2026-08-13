import type { ComponentType } from 'react';
import {
  Hammer,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  module?: number;
}

export function PagePlaceholder({
  title,
  description,
  icon: Icon = Hammer,
  module,
}: PagePlaceholderProps) {
  return (
    <div className="page-placeholder">
      <style>
        {`
          .page-placeholder {
            width: 100%;
          }

          .placeholder-header {
            margin-bottom: 28px;
          }

          .placeholder-title {
            margin: 0 0 7px;
            font-size: var(--fs-page-title);
            line-height: 1.15;
            letter-spacing: -0.025em;
            color: var(--text-primary);
          }

          .placeholder-description {
            margin: 0;
            max-width: 560px;
            font-size: var(--fs-body);
            line-height: 1.65;
            color: var(--text-secondary);
          }

          .placeholder-card {
            position: relative;
            overflow: hidden;

            width: 100%;
            min-height: 390px;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 48px 24px;

            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 12px;

            text-align: center;
          }

          .placeholder-card::before {
            content: '';

            position: absolute;
            top: 0;
            left: 0;
            right: 0;

            height: 2px;

            background: var(--accent);
            opacity: 0.8;
          }

          .placeholder-content {
            position: relative;
            z-index: 1;

            width: 100%;
            max-width: 460px;

            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .placeholder-icon {
            width: 58px;
            height: 58px;

            display: flex;
            align-items: center;
            justify-content: center;

            margin-bottom: 20px;

            border: 1px solid var(--border);
            border-radius: 14px;

            background: var(--bg-subtle);
            color: var(--accent);

            box-shadow: 0 6px 18px rgba(16, 22, 43, 0.05);
          }

          .placeholder-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;

            margin-bottom: 9px;

            font-size: 10px;
            line-height: 1;
            font-weight: 700;

            color: var(--accent);

            text-transform: uppercase;
            letter-spacing: 0.09em;
          }

          .placeholder-heading {
            margin: 0 0 8px;

            font-family: var(--font-display);
            font-size: 20px;
            line-height: 1.25;
            font-weight: 650;

            letter-spacing: -0.02em;
            color: var(--text-primary);
          }

          .placeholder-text {
            margin: 0;

            max-width: 400px;

            font-size: 13.5px;
            line-height: 1.65;

            color: var(--text-muted);
          }

          .placeholder-badge {
            display: inline-flex;
            align-items: center;
            gap: 7px;

            margin-top: 22px;
            padding: 7px 11px;

            border: 1px solid var(--border);
            border-radius: 999px;

            background: var(--bg-subtle);

            font-size: 11.5px;
            font-weight: 600;

            color: var(--text-secondary);
          }

          .placeholder-badge-dot {
            width: 6px;
            height: 6px;

            border-radius: 50%;

            background: var(--accent);
          }

          .placeholder-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;

            margin-top: 18px;

            font-size: 11.5px;
            color: var(--text-muted);
          }

          .placeholder-footer svg {
            color: var(--accent);
          }

          @media (max-width: 640px) {
            .placeholder-header {
              margin-bottom: 20px;
            }

            .placeholder-title {
              font-size: 24px;
            }

            .placeholder-description {
              font-size: 13.5px;
            }

            .placeholder-card {
              min-height: 340px;
              padding: 36px 20px;
              border-radius: 10px;
            }

            .placeholder-icon {
              width: 52px;
              height: 52px;
              margin-bottom: 17px;
            }

            .placeholder-heading {
              font-size: 18px;
            }
          }
        `}
      </style>

      <div className="placeholder-header">
        <h1 className="placeholder-title">
          {title}
        </h1>

        <p className="placeholder-description">
          {description}
        </p>
      </div>

      <div className="placeholder-card">
        <div className="placeholder-content">

          <div className="placeholder-icon">
            <Icon size={25} strokeWidth={1.7} />
          </div>

          <div className="placeholder-eyebrow">
            <Sparkles size={12} strokeWidth={2} />
            In development
          </div>

          <h2 className="placeholder-heading">
            This workspace is coming soon
          </h2>

          <p className="placeholder-text">
            This part of the BillVolt platform is currently being developed.
            The workspace will become available as the next product module is released.
          </p>

          {module && (
            <div className="placeholder-badge">
              <span className="placeholder-badge-dot" />
              Planned for Module {module}
            </div>
          )}

          <div className="placeholder-footer">
            <span>BillVolt Operations</span>
            <ArrowRight size={12} strokeWidth={2} />
          </div>

        </div>
      </div>
    </div>
  );
}