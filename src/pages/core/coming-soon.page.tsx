import React from 'react';
import { useNavigate } from 'react-router-dom';

type QuickLink = {
  label: string;
  to: string;
};

interface ComingSoonProps {
  title?: string;
  description?: string;
  quickLinks?: QuickLink[];
}

const defaultLinks: QuickLink[] = [
  { label: 'Services', to: '/services' },
  { label: 'Traces', to: '/traces' },
  { label: 'Logs', to: '/logs' },
  { label: 'Service Map', to: '/service-map' },
  { label: 'Overview', to: '/landing' },
];

const ComingSoonPage: React.FC<ComingSoonProps> = ({
  title = 'Coming Soon',
  description = 'We are crafting this page. Meanwhile, jump to other sections:',
  quickLinks = defaultLinks,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: 'transparent',
      }}
    >
      <div
        style={{
          maxWidth: 920,
          width: '92%',
          textAlign: 'center',
          padding: '48px 32px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow:
            '0 2px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: 999,
              background: 'rgba(34,197,94,0.12)',
              color: '#34d399',
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            IyziTrace
          </span>
        </div>
        <h1
          style={{
            margin: '8px 0 0 0',
            fontSize: 36,
            lineHeight: 1.2,
            color: '#E5E7EB',
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '12px auto 28px',
            color: '#9CA3AF',
            fontSize: 16,
            maxWidth: 680,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {quickLinks.map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background:
                  'linear-gradient(180deg, rgba(31,41,55,0.8) 0%, rgba(17,24,39,0.8) 100%)',
                color: '#E5E7EB',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all .15s ease',
                fontWeight: 600,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(52,211,153,0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')
              }
            >
              {l.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 28, opacity: 0.6, color: '#9CA3AF' }}>
          Need something specific here? Ping the team; we are on it.
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;


