'use client';

type GateTier = 'AUTO' | 'NOTIFY' | 'CONFIRM' | 'REJECT' | null;

type Props = {
  tier: GateTier;
  amountPaise?: number;
  budgetPaise?: number;
};

const TIERS = [
  { key: 'AUTO',    label: 'Auto',    threshold: '≤ ₹1,500', colorClass: 'gate-auto',    pct: 25 },
  { key: 'NOTIFY',  label: 'Notify',  threshold: '≤ ₹3,000', colorClass: 'gate-notify',  pct: 50 },
  { key: 'CONFIRM', label: 'Confirm', threshold: '≤ ₹5,000', colorClass: 'gate-confirm', pct: 75 },
  { key: 'REJECT',  label: 'Reject',  threshold: '> ₹5,000', colorClass: 'gate-reject',  pct: 100 },
];

const TIER_COLORS: Record<string, string> = {
  AUTO:    '#10b981',
  NOTIFY:  '#eab308',
  CONFIRM: '#f97316',
  REJECT:  '#ef4444',
};

export default function GatingIndicator({ tier, amountPaise, budgetPaise }: Props) {
  const activeTier = TIERS.find(t => t.key === tier);
  const fillPct = activeTier?.pct || 0;
  const fillColor = tier ? TIER_COLORS[tier] : 'var(--border)';

  return (
    <div>
      {/* Amount vs budget display */}
      {amountPaise != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
          <span>
            <span style={{ color: 'var(--text-secondary)' }}>Amount: </span>
            <span style={{ fontWeight: 700, color: fillColor }}>
              ₹{(amountPaise / 100).toLocaleString('en-IN')}
            </span>
          </span>
          {budgetPaise != null && (
            <span>
              <span style={{ color: 'var(--text-secondary)' }}>Budget: </span>
              <span style={{ fontWeight: 700 }}>₹{(budgetPaise / 100).toLocaleString('en-IN')}</span>
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div className="gate-track">
        <div
          className="gate-track-fill"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, #10b981, ${fillColor})`,
            boxShadow: tier ? `0 0 8px ${fillColor}60` : 'none',
          }}
        />
      </div>

      {/* Labels */}
      <div className="gate-labels">
        {TIERS.map((t) => (
          <div
            key={t.key}
            className={`gate-label ${t.colorClass} ${tier === t.key ? 'active' : ''}`}
          >
            {t.label}
            <div style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>{t.threshold}</div>
          </div>
        ))}
      </div>

      {/* Active tier description */}
      {tier && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: `${fillColor}15`,
          border: `1px solid ${fillColor}40`,
          fontSize: 11,
          color: fillColor,
          fontWeight: 500,
        }}>
          {tier === 'AUTO'    && '🟢 Automatically approved — within auto-approve threshold'}
          {tier === 'NOTIFY'  && '🟡 Notified human — within budget, above auto-approve'}
          {tier === 'CONFIRM' && '🟠 Human confirmation required — exceeds stated budget'}
          {tier === 'REJECT'  && '🔴 Purchase rejected — exceeds maximum allowed spend'}
        </div>
      )}

      {!tier && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Gate not yet evaluated
        </div>
      )}
    </div>
  );
}
