import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type Appointment = {
  id: string;
  serviceLabel: string;
  startTime: string;
  status: string;
  estimatedPrice: number | null;
  client: { fullName: string; phone: string | null };
};

const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ['En attente', 'var(--text-lo)'],
  confirmed: ['Confirmé', 'var(--blue)'],
  completed: ['Terminé', 'var(--green)'],
  cancelled: ['Annulé', 'var(--red)'],
  no_show: ['Absent', 'var(--red)'],
};

export default function WorkspaceHome() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.todayAppointments();
      setAppts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api.updateAppointmentStatus(id, status);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <WorkspaceLayout active="today">
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 20 }}>
        Rendez-vous d&apos;aujourd&apos;hui
      </h1>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : appts.length === 0 ? (
        <div style={{ color: 'var(--text-lo)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--hairline)', borderRadius: 10 }}>
          Aucun rendez-vous prévu aujourd&apos;hui.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appts.map((a) => {
            const [label, color] = STATUS_LABEL[a.status] || [a.status, 'var(--text-lo)'];
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)',
                  border: '1px solid var(--hairline)', borderRadius: 10, padding: '14px 18px',
                }}
              >
                <div className="mono" style={{ fontSize: 14, minWidth: 60 }}>
                  {new Date(a.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{a.client.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{a.serviceLabel}</div>
                </div>
                <span style={{ fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 999, padding: '3px 10px' }}>
                  {label}
                </span>
                {a.status === 'pending' && (
                  <ActionBtn onClick={() => setStatus(a.id, 'confirmed')}>Confirmer</ActionBtn>
                )}
                {a.status === 'confirmed' && (
                  <ActionBtn onClick={() => setStatus(a.id, 'completed')}>Terminer</ActionBtn>
                )}
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <ActionBtn danger onClick={() => setStatus(a.id, 'no_show')}>Absent</ActionBtn>
                )}
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceLayout>
  );
}

function ActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12, background: 'transparent',
        border: `1px solid ${danger ? 'rgba(242,104,92,0.4)' : 'var(--hairline)'}`,
        color: danger ? 'var(--red)' : 'var(--text-hi)', borderRadius: 6, padding: '6px 10px',
      }}
    >
      {children}
    </button>
  );
}
