import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type Log = {
  id: string;
  channel: string;
  category: string;
  status: string;
  recipient: string;
  message: string;
  createdAt: string;
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  sms: '✉️',
  email: '📧',
  push: '🔔',
};

const CATEGORY_LABEL: Record<string, string> = {
  appointment_reminder: 'Rappel rendez-vous',
  subscription_expiry: 'Expiration abonnement',
  subscription_blocked: 'Abonnement bloqué',
  payment_confirmation: 'Confirmation paiement',
  other: 'Autre',
};

export default function NotificationsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myNotifications()
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WorkspaceLayout active="notifications">
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 20 }}>
        Notifications envoyées
      </h1>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'var(--text-lo)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--hairline)', borderRadius: 10 }}>
          Aucune notification envoyée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 18 }}>{CHANNEL_ICON[l.channel] || '📨'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-lo)', marginBottom: 4 }}>
                  {CATEGORY_LABEL[l.category] || l.category} · vers {l.recipient} ·{' '}
                  {new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: 13 }}>{l.message}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: l.status === 'sent' ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${l.status === 'sent' ? 'var(--green)' : 'var(--red)'}`,
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {l.status === 'sent' ? 'Envoyé' : 'Échec'}
              </span>
            </div>
          ))}
        </div>
      )}
    </WorkspaceLayout>
  );
}
