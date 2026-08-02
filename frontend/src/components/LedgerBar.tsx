/**
 * Élément signature du dashboard : représente visuellement le cycle
 * d'abonnement d'une entreprise comme une jauge remplie proportionnellement
 * aux jours restants, avec des repères de rappel (J-7, J-3, J-1) intégrés
 * — puisque le compte à rebours est au cœur du modèle GOD.ROGWEBSERVICE.
 */
export function LedgerBar({
  daysRemaining,
  totalDays,
  status,
}: {
  daysRemaining: number;
  totalDays: number;
  status: 'active' | 'suspended' | 'expired';
}) {
  const pct = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  const color =
    status === 'suspended'
      ? 'var(--text-lo)'
      : status === 'expired'
      ? 'var(--red)'
      : daysRemaining <= 3
      ? 'var(--red)'
      : daysRemaining <= 7
      ? 'var(--gold)'
      : 'var(--green)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
      <div
        style={{
          position: 'relative',
          flex: 1,
          height: 6,
          background: 'var(--hairline)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
        {/* repère J-7 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${Math.min(100, (7 / totalDays) * 100)}%`,
            width: 1,
            background: 'rgba(0,0,0,0.35)',
          }}
        />
      </div>
      <span className="mono" style={{ fontSize: 12, color, minWidth: 44, textAlign: 'right' }}>
        {status === 'expired' ? 'expiré' : `${daysRemaining}j`}
      </span>
    </div>
  );
}
