'use client';

type GateTier = 'AUTO' | 'NOTIFY' | 'CONFIRM' | 'REJECT' | null;

type Props = {
  tier: GateTier;
  amountPaise?: number;
  budgetPaise?: number;
};

const TIERS = [
  { key: 'AUTO',    label: 'Auto',    threshold: '≤ ₹1,500', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', pct: 25 },
  { key: 'NOTIFY',  label: 'Notify',  threshold: '≤ ₹3,000', bgClass: 'bg-amber-50 text-amber-700 border-amber-200',   pct: 50 },
  { key: 'CONFIRM', label: 'Confirm', threshold: '≤ ₹5,000', bgClass: 'bg-orange-50 text-orange-700 border-orange-200', pct: 75 },
  { key: 'REJECT',  label: 'Reject',  threshold: '> ₹5,000', bgClass: 'bg-rose-50 text-rose-700 border-rose-200',     pct: 100 },
];

const TIER_COLORS: Record<string, string> = {
  AUTO:    'rgb(16, 185, 129)', // Emerald
  NOTIFY:  'rgb(245, 158, 11)', // Amber
  CONFIRM: 'rgb(249, 115, 22)', // Orange
  REJECT:  'rgb(239, 68, 68)',  // Rose
};

export default function GatingIndicator({ tier, amountPaise, budgetPaise }: Props) {
  const activeTier = TIERS.find(t => t.key === tier);
  const fillPct = activeTier?.pct || 0;
  const fillColor = tier ? TIER_COLORS[tier] : 'rgb(226, 232, 240)';

  return (
    <div className="space-y-4">
      {/* Title / Values */}
      {amountPaise != null && (
        <div className="flex items-center justify-between text-sm">
          <span>
            <span className="text-slate-400 font-medium">Purchase Amount: </span>
            <span className="font-extrabold text-base" style={{ color: fillColor }}>
              ₹{(amountPaise / 100).toLocaleString('en-IN')}
            </span>
          </span>
          {budgetPaise != null && (
            <span class="text-slate-500 font-medium">
              Stated Limit: <strong className="text-slate-700">₹{(budgetPaise / 100).toLocaleString('en-IN')}</strong>
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, rgb(16, 185, 129), ${fillColor})`,
          }}
        />
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {TIERS.map((t) => {
          const isActive = tier === t.key;
          return (
            <div
              key={t.key}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isActive 
                  ? `${t.bgClass} font-bold scale-[1.02] shadow-sm` 
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider leading-none mb-1">{t.label}</div>
              <div className="text-[9px] opacity-80 leading-none">{t.threshold}</div>
            </div>
          );
        })}
      </div>

      {/* Rationale Display */}
      {tier && (
        <div 
          className="p-4 rounded-xl text-xs font-medium border flex items-start gap-3 transition-opacity"
          style={{
            backgroundColor: `${fillColor}08`,
            borderColor: `${fillColor}20`,
            color: fillColor
          }}
        >
          <span className="text-base">🛡️</span>
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wide text-[10px] mb-0.5">Spend Gate Enforcement</div>
            {tier === 'AUTO'    && 'Automatically Approved — purchase amount resides safely within the user auto-approve credit limit.'}
            {tier === 'NOTIFY'  && 'Spending Notification — amount matches intent budget limits. Alerting owner, proceeding automatically in 5s.'}
            {tier === 'CONFIRM' && 'Interactive Clearance Required — item price exceeds explicit budget guidelines. Verification request sent.'}
            {tier === 'REJECT'  && 'Transaction Terminated — total cost breaches absolute structural budget ceilings. Order cancelled.'}
          </div>
        </div>
      )}

      {!tier && (
        <div className="text-center py-4 text-xs text-slate-400 italic">
          Transaction gating evaluation pending agent product selection.
        </div>
      )}
    </div>
  );

}
